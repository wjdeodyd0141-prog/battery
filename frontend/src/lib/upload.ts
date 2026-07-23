const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BASE_URL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export async function uploadImage(file: File, folder: string, maxWidth = 1200): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error('파일 크기가 5MB를 초과합니다.');

  const compressed = await compressImage(file, maxWidth);
  // blob.type을 사용해 브라우저가 실제로 저장한 타입과 일치시킴
  // (WebP 미지원 브라우저는 PNG 등으로 폴백하므로 하드코딩 금지)
  const actualType = compressed.type || 'image/webp';
  const ext = actualType.split('/')[1].replace('jpeg', 'jpg');
  const formData = new FormData();
  formData.append('file', new File([compressed], `image.${ext}`, { type: actualType }));
  formData.append('folder', folder);

  const endpoint = folder === 'reviews' ? '/upload/image/review' : '/upload/image';

  // M-4: httpOnly 쿠키 인증 — Authorization 헤더 불필요
  const res = await fetch(`${BASE_URL()}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '업로드 실패' }));
    throw new Error(error.message || '업로드 실패');
  }

  const { publicUrl } = await res.json();
  return publicUrl;
}
