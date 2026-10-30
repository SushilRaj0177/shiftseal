/** Shrinks a camera photo to a JPEG under ~250 KB before upload. */
export async function compressPhoto(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.8;
  let url = canvas.toDataURL('image/jpeg', quality);
  while (url.length > 340_000 && quality > 0.4) {
    quality -= 0.1;
    url = canvas.toDataURL('image/jpeg', quality);
  }
  return url;
}
