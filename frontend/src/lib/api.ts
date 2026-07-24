// 프로덕션 클라이언트: /backend-api 프록시 경유 (크로스 오리진 쿠키 문제 해결)
// SSR 또는 개발환경: 직접 API URL 사용
const isBrowser = typeof window !== 'undefined';
const isDev = process.env.NODE_ENV === 'development';
const BASE_URL =
  isBrowser && !isDev
    ? '/backend-api'
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api');

// Access Token 메모리 저장 — httpOnly 쿠키가 크로스 오리진에서 막혀도 Bearer 헤더로 인증
let _memoryToken: string | null = null;

export function setMemoryToken(token: string | null) {
  _memoryToken = token;
}

// 동시에 여러 요청이 401을 받을 때, 첫 번째만 refresh하고 나머지는 큐에서 대기 후 재시도
let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise<boolean>((resolve) => {
      refreshQueue.push(resolve);
    });
  }
  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.accessToken) _memoryToken = data.accessToken;
    }
    const success = res.ok;
    refreshQueue.forEach((cb) => cb(success));
    refreshQueue = [];
    return success;
  } catch {
    refreshQueue.forEach((cb) => cb(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(_memoryToken ? { Authorization: `Bearer ${_memoryToken}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  // 401 시 refresh 후 1회 재시도
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);

    // 리프레시도 실패 → 세션 만료
    if (isBrowser) {
      _memoryToken = null;
      // 로그인·회원가입·auth 페이지에서는 리다이렉트하지 않음 (무한 루프 방지)
      const isAuthPage = ['/login', '/register', '/admin/login', '/auth/'].some(
        (p) => window.location.pathname.startsWith(p),
      );
      if (!isAuthPage && localStorage.getItem('cachedUser')) {
        localStorage.removeItem('cachedUser');
        fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        const dest = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
        window.location.replace(dest);
        await new Promise<never>(() => {});
      }
      localStorage.removeItem('cachedUser');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '서버 오류가 발생했습니다.' }));
    throw new Error(error.message || '요청에 실패했습니다.');
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return null as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
