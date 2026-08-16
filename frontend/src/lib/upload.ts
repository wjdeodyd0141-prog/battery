import { getApiBaseUrl, getMemoryToken, setMemoryToken } from './api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function compressImage(file: File, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('이미지 압축에 실패했습니다.')); },
        'image/webp',
        0.9
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 로드할 수 없습니다.')); };
    img.src = url;
  });
}

async function doUpload(formData: FormData, endpoint: string): Promise<Response> {
  const token = getMemoryToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.accessToken) setMemoryToken(data.accessToken);
    }
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadImage(file: File, folder: string, maxWidth = 1200): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error('파일 크기가 5MB를 초과합니다.');

  const compressed = await compressImage(file, maxWidth);
  const actualType = compressed.type || 'image/webp';
  const ext = actualType.split('/')[1].replace('jpeg', 'jpg');
  const formData = new FormData();
  formData.append('file', new File([compressed], `image.${ext}`, { type: actualType }));
  formData.append('folder', folder);

  const endpoint = folder === 'reviews' ? '/upload/image/review' : '/upload/image';

  let res = await doUpload(formData, endpoint);

  // 401 시 토큰 갱신 후 1회 재시도
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await doUpload(formData, endpoint);
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '업로드 실패' }));
    throw new Error(error.message || '업로드 실패');
  }

  const { publicUrl } = await res.json();
  return publicUrl;
}
