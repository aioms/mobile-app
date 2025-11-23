import React, { useState, useRef, useEffect } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
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
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonFabButton,
  IonRange,
  IonContent,
  useIonToast
} from '@ionic/react';
import {
  cameraOutline,
  trashOutline,
  cloudUploadOutline,
  addOutline,
  closeOutline,
  cameraReverseOutline,
  flashlightOutline,
  flashOffOutline,
  radioButtonOnOutline,
  checkmarkOutline,
  refreshOutline,
  searchOutline
} from 'ionicons/icons';

import useCamera, { CameraOptions, CameraStreamOptions } from '@/hooks/useCamera';
import useUploadFile from '@/hooks/useUploadFile';
import { ProductImage, VALIDATION_RULES } from '@/pages/Product/ProductDetail/types/productEdit.d';
import { dataURLtoFile, getDataURLFileSize, getS3ImageUrl } from '@/helpers/fileHelper';

import './CameraModal.css';

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

interface CameraModalState {
  isOpen: boolean;
  capturedPhoto: string | null;
  isCapturing: boolean;
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
    selectFromGallery,
    isLoading: cameraLoading,
    // New PWA camera methods
    startCameraStream,
    stopCameraStream,
    switchCamera,
    captureFromStream,
    toggleTorch,
    setZoom,
    getVideoElement,
    isStreamActive,
    currentFacingMode,
    capabilities,
    torchEnabled,
    zoomLevel
  } = useCamera();

  const { uploadFile } = useUploadFile();

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // New camera modal state
  const [cameraModal, setCameraModal] = useState<CameraModalState>({
    isOpen: false,
    capturedPhoto: null,
    isCapturing: false
  });

  // Refs for camera preview
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (cameraModal.isOpen && !isStreamActive) {
      initializeCameraStream();
    }

    return () => {
      if (cameraModal.isOpen) {
        stopCameraStream();
      }
    };
  }, [cameraModal.isOpen]);

  // Attach video element to container when stream starts
  useEffect(() => {
    if (isStreamActive && cameraContainerRef.current) {
      const videoElement = getVideoElement();
      if (videoElement && !cameraContainerRef.current.contains(videoElement)) {
        cameraContainerRef.current.appendChild(videoElement);
      }
    }
  }, [isStreamActive, getVideoElement]);

  const initializeCameraStream = async () => {
    try {
      const streamOptions: CameraStreamOptions = {
        facingMode: 'environment', // Start with rear camera for product photos
        width: 1920,
        height: 1080,
        quality: 90
      };

      await startCameraStream(streamOptions);
    } catch (error) {
      presentToast({
        message: `Lỗi khi khởi động camera: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      closeCameraModal();
    }
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

    setCameraModal({
      isOpen: true,
      capturedPhoto: null,
      isCapturing: false
    });
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setCameraModal({
      isOpen: false,
      capturedPhoto: null,
      isCapturing: false
    });
  };

  const handleCapturePhoto = async () => {
    try {
      setCameraModal(prev => ({ ...prev, isCapturing: true }));

      const photo = await captureFromStream(previewCanvasRef.current || undefined);

      if (photo?.dataUrl) {
        setCameraModal(prev => ({
          ...prev,
          capturedPhoto: photo.dataUrl || null,
          isCapturing: false
        }));
      }
    } catch (error) {
      presentToast({
        message: `Lỗi khi chụp ảnh: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      setCameraModal(prev => ({ ...prev, isCapturing: false }));
    }
  };

  const handleAcceptPhoto = async () => {
    if (cameraModal.capturedPhoto) {
      // Extract metadata from captured photo data URL
      const fileName = `photo_capture_${Date.now()}.jpeg`;

      // Calculate approximate file size from data URL
      const fileSize = getDataURLFileSize(cameraModal.capturedPhoto);

      await handleUploadImage(cameraModal.capturedPhoto, fileName, fileSize);

      closeCameraModal();
    }
  };

  const handleRetakePhoto = () => {
    setCameraModal(prev => ({
      ...prev,
      capturedPhoto: null,
      isCapturing: false
    }));
  };

  const handleSwitchCamera = async () => {
    try {
      await switchCamera();
    } catch (error) {
      presentToast({
        message: 'Không thể chuyển đổi camera',
        duration: 2000,
        position: 'top',
        color: 'warning'
      });
    }
  };

  const handleToggleTorch = async () => {
    try {
      await toggleTorch();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleZoomChange = async (value: number) => {
    try {
      await setZoom(value);
    } catch (error) {
      // Error handling is done in the hook
    }
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

  const handleSelectFromGallery = async () => {
    try {
      const options: CameraOptions = {
        quality: 80,
        allowEditing: true,
        width: 1024,
        height: 1024
      };

      const photo = await selectFromGallery(options);

      if (photo?.dataUrl) {
        // Extract and validate metadata
        const mimeType = photo.mimeType || `image/${photo.format}`;
        const fileSize = photo.fileSize || 0;
        const fileName = photo.fileName || `photo_gallery_${Date.now()}.${photo.format}`;

        // Validate file type
        if (!isValidImage(fileSize, mimeType)) {
          return;
        }

        await handleUploadImage(photo.dataUrl, fileName, fileSize);
      }
    } catch (error) {
      presentToast({
        message: `Lỗi khi chọn ảnh: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    }
  };

  const isValidImage = (fileSize: number, mimeType: string) => {
    // Validate file type
    const allowedTypes = VALIDATION_RULES.IMAGES.ALLOWED_TYPES;
    if (!allowedTypes.includes(mimeType as typeof allowedTypes[number])) {
      presentToast({
        message: `Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh có định dạng: ${allowedTypes.join(', ')}`,
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
      return false;
    }

    // Validate file size
    const maxSize = VALIDATION_RULES.IMAGES.MAX_SIZE;
    if (fileSize > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      presentToast({
        message: `Kích thước ảnh quá lớn. Ảnh chụp có kích thước ${(fileSize / 1024).toFixed(2)}KB vượt quá giới hạn ${maxSizeMB}MB`,
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
      return false;
    }

    return true;
  }

  const handleUploadImage = async (imageData: string, fileName: string, fileSize: number) => {
    // Convert data URL to File for upload
    const file = dataURLtoFile(imageData, fileName);

    // Reset compression progress
    setCompressionProgress(0);
    setIsCompressing(false);

    // Upload file using useUploadFile hook with compression enabled
    const uploadResult = await uploadFile(file, {
      enableCompression: enableCompression,
      compressionOptions: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        preserveExif: true,
        onProgress: (progress: number) => {
          setCompressionProgress(progress);
          setIsCompressing(progress > 0 && progress < 100);
          console.log(`Compression progress: ${progress}%`);
        }
      },
      onSuccess: async (response) => {
        console.log('Photo uploaded successfully:', response);
        // Add the uploaded image URL to the images array
        const { fileId, filePath } = response;

        setTimeout(() => {
          const newImages = [...images, { id: fileId, path: filePath }];
          onImagesChange(newImages);

          // Reset compression state
          setCompressionProgress(0);
          setIsCompressing(false);
        }, 500)

        // presentToast({
        //   message: `Đã tải lên ảnh thành công (${(fileSize / 1024).toFixed(2)} KB)`,
        //   duration: 2000,
        //   position: 'top',
        //   color: 'success'
        // });
      },
      onError: (error) => {
        console.error('Upload failed:', error);

        // Reset compression state on error
        setCompressionProgress(0);
        setIsCompressing(false);

        // Check if this is a compression-related error
        const isCompressionError = error.message.includes('nén') ||
          error.message.includes('định dạng') ||
          error.message.includes('kích thước');

        presentToast({
          message: error.message,
          duration: isCompressionError ? 4000 : 3000,
          position: 'top',
          color: isCompressionError ? 'warning' : 'danger'
        });
      }
    });

    console.log('Photo upload result:', {
      fileName,
      fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
      uploadResult
    });
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
      <IonCard className="rounded-xl mt-4 shadow-sm">
        <IonCardHeader>
          <IonCardTitle>Hình ảnh sản phẩm</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          {/* Image Grid */}
          <IonGrid>
            <IonRow>
              {/* TODO: Will be remove after migrate to new image storage */}
              {imageUrls?.map(url => (
                <IonCol size="6" sizeMd="4" key={url}>
                  <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
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
                  <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
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
                          width: '32px',
                          height: '32px',
                          '--border-radius': '50%'
                        }}
                        onClick={() => handleDeleteImage(index)}
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
                    disabled={cameraLoading || isCompressing || isUploading}
                  >
                    {cameraLoading || isCompressing || isUploading ? (
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
                  Đang tải lên... {uploadProgress}%
                </p>
              </IonText>
              <IonProgressBar value={uploadProgress / 100} />
            </div>
          )}

          {/* Upload Button */}
          {!disabled && images.length > 0 && onConfirmUpload && hasChanges && (
            <IonButton
              expand="block"
              fill="solid"
              color="primary"
              style={{ marginTop: '16px' }}
              onClick={() => onConfirmUpload(images)}
              disabled={isUploading || isCompressing}
            >
              <IonIcon icon={cloudUploadOutline} slot="start" />
              {isUploading ? 'Đang tải lên...' : isCompressing ? 'Đang nén ảnh...' : `Tải lên ${images.length} ảnh`}
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
        </IonCardContent>
      </IonCard>

      {/* Enhanced Camera Modal */}
      <IonModal isOpen={cameraModal.isOpen} onDidDismiss={closeCameraModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Chụp ảnh sản phẩm</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeCameraModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="camera-modal-content">
          {cameraModal.capturedPhoto ? (
            // Photo Preview Mode
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000'
              }}>
                <IonImg
                  src={cameraModal.capturedPhoto}
                  alt="Captured photo"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Photo Preview Controls */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '16px'
              }}>
                <IonFabButton
                  color="light"
                  onClick={handleRetakePhoto}
                >
                  <IonIcon icon={refreshOutline} />
                </IonFabButton>

                <IonFabButton
                  color="success"
                  onClick={handleAcceptPhoto}
                >
                  <IonIcon icon={checkmarkOutline} />
                </IonFabButton>
              </div>
            </div>
          ) : (
            // Camera Preview Mode
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundColor: '#000'
            }}>
              {/* Camera Preview Container */}
              <div
                ref={cameraContainerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              />

              {/* Camera Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 10
              }}>
                {/* Focus Frame */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '250px',
                  height: '250px',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
                }} />

                {/* Corner indicators */}
                <div style={{
                  position: 'absolute',
                  top: 'calc(50% - 125px)',
                  left: 'calc(50% - 125px)',
                  width: '20px',
                  height: '20px',
                  borderTop: '3px solid #fff',
                  borderLeft: '3px solid #fff'
                }} />
                <div style={{
                  position: 'absolute',
                  top: 'calc(50% - 125px)',
                  right: 'calc(50% - 125px)',
                  width: '20px',
                  height: '20px',
                  borderTop: '3px solid #fff',
                  borderRight: '3px solid #fff'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(50% - 125px)',
                  left: 'calc(50% - 125px)',
                  width: '20px',
                  height: '20px',
                  borderBottom: '3px solid #fff',
                  borderLeft: '3px solid #fff'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(50% - 125px)',
                  right: 'calc(50% - 125px)',
                  width: '20px',
                  height: '20px',
                  borderBottom: '3px solid #fff',
                  borderRight: '3px solid #fff'
                }} />
              </div>

              {/* Camera Controls */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                zIndex: 20
              }}>
                {/* Switch Camera */}
                <IonFabButton
                  size="small"
                  color="light"
                  onClick={handleSwitchCamera}
                  disabled={cameraModal.isCapturing}
                >
                  <IonIcon icon={cameraReverseOutline} />
                </IonFabButton>

                {/* Capture Button */}
                <IonFabButton
                  color="primary"
                  onClick={handleCapturePhoto}
                  disabled={cameraModal.isCapturing || !isStreamActive}
                  style={{ transform: 'scale(1.2)' }}
                >
                  {cameraModal.isCapturing ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <IonIcon icon={radioButtonOnOutline} />
                  )}
                </IonFabButton>

                {/* Flash Toggle */}
                {capabilities.torch && (
                  <IonFabButton
                    size="small"
                    color={torchEnabled ? 'warning' : 'light'}
                    onClick={handleToggleTorch}
                    disabled={cameraModal.isCapturing}
                  >
                    <IonIcon icon={torchEnabled ? flashlightOutline : flashOffOutline} />
                  </IonFabButton>
                )}
              </div>

              {/* Zoom Control */}
              {capabilities.zoom && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '200px',
                  zIndex: 20
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '8px 12px',
                    borderRadius: '20px'
                  }}>
                    <IonIcon icon={searchOutline} style={{ color: 'white', fontSize: '16px' }} />
                    <IonRange
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoomLevel}
                      onIonInput={(e) => handleZoomChange(e.detail.value as number)}
                      style={{ flex: 1 }}
                    />
                    <IonText style={{ color: 'white', fontSize: '12px', minWidth: '30px' }}>
                      {zoomLevel.toFixed(1)}x
                    </IonText>
                  </div>
                </div>
              )}

              {/* Camera Info */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '8px 12px',
                borderRadius: '20px',
                zIndex: 20
              }}>
                <IonText style={{ color: 'white', fontSize: '12px' }}>
                  {currentFacingMode === 'environment' ? 'Camera sau' : 'Camera trước'}
                </IonText>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Hidden canvas for photo capture */}
      <canvas
        ref={previewCanvasRef}
        style={{ display: 'none' }}
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
          // {
          //   text: 'Chọn từ thư viện',
          //   icon: imagesOutline,
          //   handler: handleSelectFromGallery
          // },
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
    </>
  );
};