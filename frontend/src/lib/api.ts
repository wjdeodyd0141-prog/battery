const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
