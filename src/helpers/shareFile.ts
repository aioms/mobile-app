import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
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
  dialogTitle = "Chia sẻ phiếu thu",
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await shareNative(data, fileName, dialogTitle);
  } else {
    downloadBlob(data, fileName);
  }
}

/** Share multiple document pages in one native sheet, or download each page on web. */
export async function shareOrDownloadFiles(
  files: { data: Blob; fileName: string }[],
  dialogTitle: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    for (const file of files) downloadBlob(file.data, file.fileName);
    return;
  }
  const urls: string[] = [];
  for (const file of files) {
    const result = await Filesystem.writeFile({
      path: file.fileName,
      data: await blobToBase64(file.data),
      directory: Directory.Cache,
    });
    urls.push(result.uri);
  }
  await Share.share({ title: dialogTitle, files: urls, dialogTitle });
}

async function shareNative(
  data: Blob,
  fileName: string,
  dialogTitle: string,
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
    dialogTitle,
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
