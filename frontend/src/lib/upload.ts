const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BASE_URL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

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
        0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 로드할 수 없습니다.')); };
    img.src = url;
  });
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error('파일 크기가 5MB를 초과합니다.');

  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('file', new File([compressed], 'image.webp', { type: 'image/webp' }));
  formData.append('folder', folder);

  const endpoint = folder === 'reviews' ? '/upload/image/review' : '/upload/image';
  const token = getToken();

  const res = await fetch(`${BASE_URL()}${endpoint}`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '업로드 실패' }));
    throw new Error(error.message || '업로드 실패');
  }

  const { publicUrl } = await res.json();
  return publicUrl;
}
