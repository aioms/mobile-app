import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Share or download a file.
 * - Native (iOS/Android): write to cache, then use Share plugin.
 * - Web/PWA: trigger a blob download.
 */
export async function shareOrDownload(
  data: Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await shareNative(data, fileName, mimeType);
  } else {
    downloadBlob(data, fileName);
  }
}

async function shareNative(
  data: Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const base64 = await blobToBase64(data);

  const writeResult = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: fileName,
    url: writeResult.uri,
    dialogTitle: "Chia sẻ phiếu thu",
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
