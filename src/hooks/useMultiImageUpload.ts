import { useCallback, useState } from 'react';

import { ProductImage } from '@/pages/Product/ProductDetail/types/productEdit.d';
import { runWithConcurrency } from '@/pages/Product/ProductDetail/helpers/runWithConcurrency';
import useUploadFile from './useUploadFile';

const MAX_CONCURRENT_UPLOADS = 3;

interface MultiImageUploadResult {
  uploadedImages: ProductImage[];
  failedCount: number;
}

interface UseMultiImageUpload {
  isUploading: boolean;
  completedCount: number;
  totalCount: number;
  progress: number;
  uploadImages: (files: File[]) => Promise<MultiImageUploadResult>;
}

const useMultiImageUpload = (): UseMultiImageUpload => {
  const { uploadFile } = useUploadFile();
  const [isUploading, setIsUploading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const uploadImages = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setCompletedCount(0);
    setTotalCount(files.length);

    try {
      const results = await runWithConcurrency(
        files,
        MAX_CONCURRENT_UPLOADS,
        async (file) => {
          const result = await uploadFile(file, {
            enableCompression: true,
            showToast: false,
            compressionOptions: {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              preserveExif: true,
            },
          });
          setCompletedCount((count) => count + 1);
          return result;
        },
      );

      const uploadedImages = results.flatMap((result) =>
        result ? [{ id: result.fileId, path: result.filePath }] : []
      );
      return {
        uploadedImages,
        failedCount: files.length - uploadedImages.length,
      };
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  return {
    isUploading,
    completedCount,
    totalCount,
    progress: totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0,
    uploadImages,
  };
};

export default useMultiImageUpload;
