import React, { useState } from 'react';
import {
  IonIcon,
  IonImg,
  IonButton,
  IonSpinner,
  IonProgressBar,
  IonText,
  IonAlert,
  IonActionSheet,
  useIonToast
} from '@ionic/react';
import {
  cameraOutline,
  trashOutline,
  checkmarkOutline,
  imagesOutline,
  addOutline
} from 'ionicons/icons';

import useCamera, { CameraOptions } from '@/hooks/useCamera';
import useMultiImageUpload from '@/hooks/useMultiImageUpload';
import usePhotoLibrary from '@/hooks/usePhotoLibrary';
import useUploadFile from '@/hooks/useUploadFile';
import { dataURLtoFile, getS3ImageUrl } from '@/helpers/fileHelper';
import { ImagePreview } from '@/components/ImagePreview/ImagePreview';
import { CustomCameraModal } from '@/components/CustomCameraModal';
import { ProductImage, VALIDATION_RULES } from '@/pages/Product/ProductDetail/types/productEdit.d';

interface ProductImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  enableCompression?: boolean;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  images = [],
  onImagesChange,
  maxImages = VALIDATION_RULES.IMAGES.MAX_COUNT,
  disabled = false,
  enableCompression = true
}) => {
  const [presentToast] = useIonToast();
  const { takePhoto, isLoading: cameraLoading } = useCamera();
  const { uploadFile } = useUploadFile();
  const { isSelecting, selectMultipleImages } = usePhotoLibrary();
  const {
    isUploading,
    completedCount,
    totalCount,
    progress: uploadProgress,
    uploadImages
  } = useMultiImageUpload();

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCustomCamera, setShowCustomCamera] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const isBusy = cameraLoading || isSelecting || isCompressing || isUploading;

  const handleAddImage = () => {
    if (images.length >= maxImages) {
      presentToast({
        message: `Chỉ được tải lên tối đa ${maxImages} hình ảnh`,
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
      return;
    }
    setShowActionSheet(true);
  };

  const openCameraModal = () => {
    if (images.length >= maxImages) {
      presentToast({
        message: `Chỉ được tải lên tối đa ${maxImages} hình ảnh`,
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
      return;
    }
    setShowCustomCamera(true);
  };

  const isValidImage = (
    fileSize: number,
    mimeType: string,
    showValidationToast = true
  ) => {
    const allowedTypes = VALIDATION_RULES.IMAGES.ALLOWED_TYPES;
    if (!allowedTypes.includes(mimeType as (typeof allowedTypes)[number])) {
      if (showValidationToast) {
        presentToast({
          message: `Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh có định dạng: ${allowedTypes.join(', ')}`,
          duration: 3000,
          position: 'top',
          color: 'warning'
        });
      }
      return false;
    }

    const maxSize = VALIDATION_RULES.IMAGES.MAX_SIZE;
    if (fileSize > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      if (showValidationToast) {
        presentToast({
          message: `Kích thước ảnh quá lớn. Ảnh chụp có kích thước ${(fileSize / 1024).toFixed(2)}KB vượt quá giới hạn ${maxSizeMB}MB`,
          duration: 3000,
          position: 'top',
          color: 'warning'
        });
      }
      return false;
    }

    return true;
  };

  const handleUploadImage = async (
    imageData: string,
    fileName: string,
    fileSize: number
  ) => {
    const file = dataURLtoFile(imageData, fileName);
    if (!isValidImage(file.size || fileSize, file.type)) return;

    setCompressionProgress(0);
    setIsCompressing(false);

    const uploadResult = await uploadFile(file, {
      enableCompression,
      compressionOptions: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        preserveExif: true,
        onProgress: (progress: number) => {
          setCompressionProgress(progress);
          setIsCompressing(progress > 0 && progress < 100);
        }
      },
      onError: () => {
        setCompressionProgress(0);
        setIsCompressing(false);
      }
    });

    if (uploadResult) {
      onImagesChange([
        ...images,
        { id: uploadResult.fileId, path: uploadResult.filePath }
      ]);
    }
    setCompressionProgress(0);
    setIsCompressing(false);
  };

  const handleTakePhoto = async () => {
    try {
      const options: CameraOptions = {
        quality: 80,
        allowEditing: true,
        width: 1024,
        height: 1024
      };

      const photo = await takePhoto(options);

      if (photo?.dataUrl) {
        const mimeType = photo.mimeType || `image/${photo.format}`;
        const fileSize = photo.fileSize || 0;
        const fileName = photo.fileName || `photo_take_${Date.now()}.${photo.format}`;

        if (!isValidImage(fileSize, mimeType)) {
          return;
        }

        await handleUploadImage(photo.dataUrl, fileName, fileSize);
      }
    } catch (error) {
      presentToast({
        message: `Lỗi khi chụp ảnh: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    }
  };

  const handleSelectMultipleFromGallery = async () => {
    const remainingSlots = maxImages - images.length;
    const selectedFiles = await selectMultipleImages(remainingSlots);
    const validFiles = selectedFiles.filter((file) =>
      isValidImage(file.size, file.type, false)
    );

    if (selectedFiles.length !== validFiles.length) {
      presentToast({
        message: `${selectedFiles.length - validFiles.length} ảnh không hợp lệ đã được bỏ qua`,
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
    }
    if (validFiles.length === 0) return;

    const { uploadedImages, failedCount } = await uploadImages(validFiles);
    if (uploadedImages.length > 0) {
      onImagesChange([...images, ...uploadedImages]);
    }

    presentToast({
      message:
        failedCount > 0
          ? `Đã tải ${uploadedImages.length}/${validFiles.length} ảnh. ${failedCount} ảnh thất bại.`
          : `Đã tải ${uploadedImages.length} ảnh từ thư viện`,
      duration: failedCount > 0 ? 3500 : 2000,
      position: 'top',
      color: failedCount > 0 ? 'warning' : 'success'
    });
  };

  const handleDeleteImage = (index: number) => {
    setSelectedImageIndex(index);
    setShowDeleteAlert(true);
  };

  const confirmDeleteImage = () => {
    if (selectedImageIndex >= 0) {
      const newImages = images.filter((_, index) => index !== selectedImageIndex);
      onImagesChange(newImages);

      presentToast({
        message: 'Đã xóa ảnh',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
    }
    setSelectedImageIndex(-1);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <div className="mb-6">
        {images.length > 0 ? (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((image, index) => (
                <div
                  key={image.id || index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                  onClick={() => {
                    setPreviewIndex(index);
                    setPreviewOpen(true);
                  }}
                >
                  <IonImg
                    src={getS3ImageUrl(image.path)}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <IonButton
                      fill="solid"
                      color="danger"
                      size="small"
                      className="absolute top-1 right-1 w-8 h-8"
                      style={{
                        '--border-radius': '50%',
                        '--padding-start': '0',
                        '--padding-end': '0'
                      }}
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(index);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  )}
                </div>
              ))}

              {/* Add More Button */}
              {!disabled && images.length < maxImages && (
                <button
                  type="button"
                  className="aspect-square border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 transition-colors"
                  onClick={handleAddImage}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <IonSpinner name="crescent" color="primary" />
                  ) : (
                    <>
                      <IonIcon
                        icon={addOutline}
                        className="text-2xl text-teal-600 mb-1"
                      />
                      <p className="text-xs text-teal-600 font-medium">Thêm ảnh</p>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Image Count */}
            <IonText color="medium">
              <p className="text-center text-xs">
                {images.length}/{maxImages} ảnh
              </p>
            </IonText>
          </>
        ) : (
          /* Empty State - Click to Add First Image */
          <button
            type="button"
            className="w-full h-48 border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 transition-colors"
            onClick={handleAddImage}
            disabled={disabled || isBusy}
          >
            {isBusy ? (
              <IonSpinner name="crescent" color="primary" />
            ) : (
              <>
                <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mb-3">
                  <IonIcon
                    icon={cameraOutline}
                    className="text-2xl text-teal-600"
                  />
                </div>
                <p className="text-teal-600 font-medium">Thêm ảnh sản phẩm</p>
                <p className="text-teal-500 text-sm mt-1">Nhấn để chụp hoặc chọn ảnh</p>
              </>
            )}
          </button>
        )}

        {/* Compression Progress */}
        {isCompressing && (
          <div className="mt-3">
            <IonText>
              <p className="mb-2 text-sm">
                Đang nén ảnh... {Math.round(compressionProgress)}%
              </p>
            </IonText>
            <IonProgressBar value={compressionProgress / 100} color="primary" />
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-3">
            <IonText>
              <p className="mb-2 text-sm">
                Đang tải ảnh {completedCount}/{totalCount}... {uploadProgress}%
              </p>
            </IonText>
            <IonProgressBar value={uploadProgress / 100} />
          </div>
        )}

        {/* Compression Info */}
        {enableCompression && (
          <IonText color="medium">
            <p className="text-center mt-2 text-xs">
              <IonIcon icon={checkmarkOutline} className="align-middle" /> Ảnh sẽ được tự động nén để tối ưu dung lượng
            </p>
          </IonText>
        )}
      </div>

      <CustomCameraModal
        isOpen={showCustomCamera}
        onDismiss={() => setShowCustomCamera(false)}
        onAcceptPhoto={handleUploadImage}
      />

      {/* Action Sheet for Image Source */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'Chụp ảnh (Native)',
            icon: cameraOutline,
            handler: handleTakePhoto
          },
          {
            text: 'Chụp ảnh (Custom)',
            icon: cameraOutline,
            handler: openCameraModal
          },
          {
            text: 'Chọn ảnh từ thư viện',
            icon: imagesOutline,
            handler: handleSelectMultipleFromGallery
          },
          {
            text: 'Hủy',
            role: 'cancel'
          }
        ]}
      />

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa ảnh này?"
        buttons={[
          {
            text: 'Hủy',
            role: 'cancel'
          },
          {
            text: 'Xóa',
            role: 'destructive',
            handler: confirmDeleteImage
          }
        ]}
      />

      {/* Image Preview Component */}
      <ImagePreview
        images={images.map((img) => getS3ImageUrl(img.path))}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};
