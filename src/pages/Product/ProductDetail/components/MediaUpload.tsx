import React, { useState } from 'react';
import { AppCard } from '@/components/UI';
import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonProgressBar,
  IonText,
  IonSpinner,
  IonActionSheet,
  IonAlert,
  useIonToast
} from '@ionic/react';
import {
  cameraOutline,
  trashOutline,
  cloudUploadOutline,
  addOutline,
  checkmarkOutline,
  imagesOutline
} from 'ionicons/icons';

import useCamera, { CameraOptions } from '@/hooks/useCamera';
import useMultiImageUpload from '@/hooks/useMultiImageUpload';
import usePhotoLibrary from '@/hooks/usePhotoLibrary';
import useUploadFile from '@/hooks/useUploadFile';
import { ProductImage, VALIDATION_RULES } from '@/pages/Product/ProductDetail/types/productEdit.d';
import { dataURLtoFile, getS3ImageUrl } from '@/helpers/fileHelper';

import { ImagePreview } from '@/components/ImagePreview/ImagePreview';
import { CustomCameraModal } from './CustomCameraModal';

interface MediaUploadProps {
  imageUrls?: string[]; // TODO: Will be remove after migration
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  onConfirmUpload?: (images: ProductImage[]) => Promise<boolean>;
  maxImages?: number;
  disabled?: boolean;
  hasChanges?: boolean;
  enableCompression?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  imageUrls = [],
  images = [],
  onImagesChange,
  onConfirmUpload,
  maxImages = VALIDATION_RULES.IMAGES.MAX_COUNT,
  disabled = false,
  hasChanges = false,
  enableCompression = true
}) => {
  const [presentToast] = useIonToast();
  const {
    takePhoto,
    isLoading: cameraLoading,
  } = useCamera();

  const { uploadFile } = useUploadFile();
  const { isSelecting, selectMultipleImages } = usePhotoLibrary();
  const {
    isUploading,
    completedCount,
    totalCount,
    progress: uploadProgress,
    uploadImages,
  } = useMultiImageUpload();

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [showCustomCamera, setShowCustomCamera] = useState(false);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const isBusy = cameraLoading || isSelecting || isCompressing ||
    isUploading || isSavingImages;

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
        // Extract metadata if available
        const mimeType = photo.mimeType || `image/${photo.format}`;
        const fileSize = photo.fileSize || 0;
        const fileName = photo.fileName || `photo_take_${Date.now()}.${photo.format}`;

        // Validate file type
        if (!isValidImage(fileSize, mimeType)) {
          return;
        }

        // Upload file using useUploadFile hook
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
        color: 'warning',
      });
    }
    if (validFiles.length === 0) return;

    const { uploadedImages, failedCount } = await uploadImages(validFiles);
    if (uploadedImages.length > 0) {
      onImagesChange([...images, ...uploadedImages]);
    }

    presentToast({
      message: failedCount > 0
        ? `Đã tải ${uploadedImages.length}/${validFiles.length} ảnh. ${failedCount} ảnh thất bại.`
        : `Đã tải ${uploadedImages.length} ảnh từ thư viện`,
      duration: failedCount > 0 ? 3500 : 2000,
      position: 'top',
      color: failedCount > 0 ? 'warning' : 'success',
    });
  };

  const isValidImage = (
    fileSize: number,
    mimeType: string,
    showValidationToast = true,
  ) => {
    // Validate file type
    const allowedTypes = VALIDATION_RULES.IMAGES.ALLOWED_TYPES;
    if (!allowedTypes.includes(mimeType as typeof allowedTypes[number])) {
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

    // Validate file size
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

  const handleUploadImage = async (imageData: string, fileName: string, fileSize: number) => {
    const file = dataURLtoFile(imageData, fileName);
    if (!isValidImage(file.size || fileSize, file.type)) return;

    setCompressionProgress(0);
    setIsCompressing(false);

    const uploadResult = await uploadFile(file, {
      enableCompression: enableCompression,
      compressionOptions: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        preserveExif: true,
        onProgress: (progress: number) => {
          setCompressionProgress(progress);
          setIsCompressing(progress > 0 && progress < 100);
        }
      },
      onError: (error) => {
        setCompressionProgress(0);
        setIsCompressing(false);
      }
    });

    if (uploadResult) {
      onImagesChange([
        ...images,
        { id: uploadResult.fileId, path: uploadResult.filePath },
      ]);
    }
    setCompressionProgress(0);
    setIsCompressing(false);
  }

  const handleConfirmUpload = async () => {
    if (!onConfirmUpload) return;
    setIsSavingImages(true);
    try {
      await onConfirmUpload(images);
    } finally {
      setIsSavingImages(false);
    }
  }

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
      <AppCard className="mx-4 mb-3 p-4">
        <h2 className="text-xl font-bold mb-4">Hình ảnh sản phẩm</h2>
        
        <div>
          {/* Image Grid */}
          <IonGrid>
            <IonRow>
              {/* TODO: Will be remove after migrate to new image storage */}
              {imageUrls?.map((url, index) => (
                <IonCol size="6" sizeMd="4" key={url}>
                  <div 
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}
                    onClick={() => {
                      setPreviewIndex(index);
                      setPreviewOpen(true);
                    }}
                  >
                    <IonImg
                      src={url}
                      alt={`Product image`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </IonCol>
              ))}

              {images.map((image, index) => (
                <IonCol size="6" sizeMd="4" key={index}>
                  <div 
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}
                    onClick={() => {
                      setPreviewIndex((imageUrls?.length || 0) + index);
                      setPreviewOpen(true);
                    }}
                  >
                    <IonImg
                      src={getS3ImageUrl(image.path)}
                      alt={`Product image ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {!disabled && (
                      <IonButton
                        fill="solid"
                        color="danger"
                        size="small"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '44px',
                          height: '44px',
                          '--border-radius': '50%'
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
                </IonCol>
              ))}

              {/* Add Image Button */}
              {!disabled && images.length < maxImages && (
                <IonCol size="6" sizeMd="4">
                  <IonButton
                    fill="outline"
                    expand="block"
                    style={{
                      aspectRatio: '1',
                      height: 'auto',
                      '--border-style': 'dashed',
                      '--border-width': '2px'
                    }}
                    onClick={handleAddImage}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <IonIcon icon={addOutline} size="large" />
                        <IonText>
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.8em' }}>Thêm ảnh</p>
                        </IonText>
                      </div>
                    )}
                  </IonButton>
                </IonCol>
              )}
            </IonRow>
          </IonGrid>

          {/* Compression Progress */}
          {isCompressing && (
            <div style={{ marginTop: '16px' }}>
              <IonText>
                <p style={{ marginBottom: '8px', fontSize: '0.9em' }}>
                  Đang nén ảnh... {Math.round(compressionProgress)}%
                </p>
              </IonText>
              <IonProgressBar value={compressionProgress / 100} color="primary" />
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div style={{ marginTop: '16px' }}>
              <IonText>
                <p style={{ marginBottom: '8px', fontSize: '0.9em' }}>
                  Đang tải ảnh {completedCount}/{totalCount}... {uploadProgress}%
                </p>
              </IonText>
              <IonProgressBar value={uploadProgress / 100} />
            </div>
          )}

          {!disabled && onConfirmUpload && hasChanges && (
            <IonButton
              expand="block"
              fill="solid"
              color="primary"
              style={{ marginTop: '16px' }}
              onClick={handleConfirmUpload}
              disabled={isBusy}
            >
              <IonIcon icon={cloudUploadOutline} slot="start" />
              {isSavingImages ? 'Đang lưu...' : 'Lưu thay đổi ảnh'}
            </IonButton>
          )}

          {/* Image Count Info */}
          <IonText color="medium">
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.8em' }}>
              {images.length}/{maxImages} ảnh
            </p>
          </IonText>

          {/* Compression Info */}
          {enableCompression && (
            <IonText color="medium">
              <p style={{ textAlign: 'center', marginTop: '4px', fontSize: '0.75em' }}>
                <IonIcon icon={checkmarkOutline} size="small" /> Ảnh sẽ được tự động nén để tối ưu dung lượng
              </p>
            </IonText>
          )}
        </div>
      </AppCard>

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
        images={[...(imageUrls || []), ...images.map(img => getS3ImageUrl(img.path))]}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};
