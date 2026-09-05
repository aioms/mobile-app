import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Sanitizes a string for use as a file name
 */
export function sanitizeFileName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 60) || 'image'
  );
}

/**
 * Checks if the current environment supports sharing files (Web Share API Level 2 or Capacitor Native)
 */
export function canShareFiles(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    if (typeof navigator.canShare === 'function') {
      try {
        const testFile = new File([''], 'test.png', { type: 'image/png' });
        return navigator.canShare({ files: [testFile] });
      } catch {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Fetches an image URL and returns a Blob
 */
export async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return await response.blob();
}

/**
 * Converts a Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Triggers direct browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

/**
 * Downloads a single image from URL.
 * - On Web/PWA: downloads directly via Blob & <a> tag (with direct link fallback if CORS blocks fetch).
 * - On Native: writes to Directory.Cache and triggers native share / save.
 */
export async function downloadImageFromUrl(
  url: string,
  fileName: string
): Promise<void> {
  try {
    const blob = await fetchImageBlob(url);

    if (Capacitor.isNativePlatform()) {
      const base64 = await blobToBase64(blob);
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        url: writeResult.uri,
        dialogTitle: 'Lưu hoặc chia sẻ ảnh',
      });
    } else {
      triggerBlobDownload(blob, fileName);
    }
  } catch (error) {
    console.warn('Blob fetch failed, falling back to direct link download', error);
    if (!Capacitor.isNativePlatform()) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      throw error;
    }
  }
}

/**
 * Shares an image using Native Share Sheet (Capacitor Native or Web Share API in PWA)
 * Returns true if shared, false if cancelled or unsupported
 */
export async function shareImageFromUrl(
  url: string,
  fileName: string,
  title?: string
): Promise<boolean> {
  try {
    const blob = await fetchImageBlob(url);
    const mimeType = blob.type || 'image/jpeg';

    if (Capacitor.isNativePlatform()) {
      const base64 = await blobToBase64(blob);
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: title || fileName,
        url: writeResult.uri,
        dialogTitle: title || 'Chia sẻ hình ảnh',
      });
      return true;
    }

    // Web / PWA Share API Level 2
    const file = new File([blob], fileName, { type: mimeType });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || fileName,
      });
      return true;
    }

    // If Web Share doesn't support files, fallback to download
    triggerBlobDownload(blob, fileName);
    return true;
  } catch (error: unknown) {
    // User cancelled share sheet (AbortError) - not an actual error
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}

/**
 * Downloads multiple images sequentially with a delay to prevent browser throttling
 */
export async function downloadMultipleImagesFromUrls(
  urls: string[],
  baseName: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const safeBase = sanitizeFileName(baseName);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
    const cleanExt = extension.length <= 4 && extension.length >= 3 ? extension : 'jpg';
    const fileName = `${safeBase}_${i + 1}.${cleanExt}`;

    try {
      await downloadImageFromUrl(url, fileName);
      success++;
      onProgress?.(i + 1, urls.length);
    } catch (e) {
      console.error(`Failed to download image ${i + 1}:`, e);
      failed++;
    }

    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  return { success, failed };
}
