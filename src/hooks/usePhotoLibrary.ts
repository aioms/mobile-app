import { useCallback, useState } from 'react';
import { Camera, GalleryPhoto } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useIonToast } from '@ionic/react';

interface UsePhotoLibrary {
  isSelecting: boolean;
  selectMultipleImages: (limit: number) => Promise<File[]>;
}

const getMimeType = (format: string, fallback?: string): string => {
  if (fallback?.startsWith('image/')) return fallback;
  const normalizedFormat = format.toLowerCase() === 'jpg' ? 'jpeg' : format;
  return `image/${normalizedFormat || 'jpeg'}`;
};

const galleryPhotoToFile = async (
  photo: GalleryPhoto,
  index: number,
): Promise<File> => {
  const response = await fetch(photo.webPath);
  if (!response.ok) {
    throw new Error('Không thể đọc ảnh đã chọn');
  }

  const blob = await response.blob();
  const format = photo.format || blob.type.split('/')[1] || 'jpeg';
  return new File(
    [blob],
    `product_${Date.now()}_${index + 1}.${format}`,
    { type: getMimeType(format, blob.type) },
  );
};

const pickWebImages = (): Promise<File[]> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.multiple = true;
    input.style.display = 'none';

    const finish = (files: File[]) => {
      input.remove();
      resolve(files);
    };

    input.onchange = () => finish(Array.from(input.files || []));
    input.oncancel = () => finish([]);
    document.body.appendChild(input);
    input.click();
  });
};

const usePhotoLibrary = (): UsePhotoLibrary => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [presentToast] = useIonToast();

  const selectMultipleImages = useCallback(async (limit: number) => {
    if (limit <= 0) return [];

    try {
      setIsSelecting(true);
      const selectedFiles = Capacitor.isNativePlatform()
        ? await Camera.pickImages({
          quality: 90,
          width: 1920,
          height: 1920,
          correctOrientation: true,
          limit,
        }).then(({ photos }) =>
          Promise.all(photos.map(galleryPhotoToFile))
        )
        : await pickWebImages();

      if (selectedFiles.length > limit) {
        presentToast({
          message: `Chỉ còn chỗ cho ${limit} ảnh`,
          duration: 2500,
          position: 'top',
          color: 'warning',
        });
      }

      return selectedFiles.slice(0, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('cancel')) return [];

      presentToast({
        message: `Không thể chọn ảnh: ${message}`,
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
      return [];
    } finally {
      setIsSelecting(false);
    }
  }, [presentToast]);

  return { isSelecting, selectMultipleImages };
};

export default usePhotoLibrary;
