import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonImg,
  IonModal,
  IonRange,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import {
  cameraReverseOutline,
  checkmarkOutline,
  closeOutline,
  flashOffOutline,
  flashlightOutline,
  radioButtonOnOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';

import { getDataURLFileSize } from '@/helpers/fileHelper';
import useCamera, { CameraStreamOptions } from '@/hooks/useCamera';
import './CameraModal.css';

interface CustomCameraModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onAcceptPhoto: (
    imageData: string,
    fileName: string,
    fileSize: number,
  ) => Promise<void>;
}

export const CustomCameraModal = ({
  isOpen,
  onDismiss,
  onAcceptPhoto,
}: CustomCameraModalProps) => {
  const [presentToast] = useIonToast();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
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
    zoomLevel,
  } = useCamera();

  const closeModal = useCallback(() => {
    stopCameraStream();
    setCapturedPhoto(null);
    setIsCapturing(false);
    onDismiss();
  }, [onDismiss, stopCameraStream]);

  useEffect(() => {
    if (!isOpen || isStreamActive || capturedPhoto) return;

    const options: CameraStreamOptions = {
      facingMode: 'environment',
      width: 1920,
      height: 1080,
      quality: 90,
    };
    startCameraStream(options).catch((error) => {
      presentToast({
        message: `Lỗi khi khởi động camera: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
      closeModal();
    });
  }, [
    capturedPhoto,
    closeModal,
    isOpen,
    isStreamActive,
    presentToast,
    startCameraStream,
  ]);

  useEffect(() => {
    if (!isStreamActive || !cameraContainerRef.current) return;
    const videoElement = getVideoElement();
    if (videoElement && !cameraContainerRef.current.contains(videoElement)) {
      cameraContainerRef.current.appendChild(videoElement);
    }
  }, [getVideoElement, isStreamActive]);

  const capturePhoto = async () => {
    try {
      setIsCapturing(true);
      const photo = await captureFromStream(
        previewCanvasRef.current || undefined,
      );
      if (photo?.dataUrl) setCapturedPhoto(photo.dataUrl);
    } catch (error) {
      presentToast({
        message: `Lỗi khi chụp ảnh: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const acceptPhoto = async () => {
    if (!capturedPhoto) return;
    setIsCapturing(true);
    try {
      await onAcceptPhoto(
        capturedPhoto,
        `photo_capture_${Date.now()}.jpeg`,
        getDataURLFileSize(capturedPhoto),
      );
      closeModal();
    } finally {
      setIsCapturing(false);
    }
  };

  const switchActiveCamera = async () => {
    try {
      await switchCamera();
    } catch (_error) {
      presentToast({
        message: 'Không thể chuyển đổi camera',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={closeModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Chụp ảnh sản phẩm</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeModal} aria-label="Đóng camera">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="camera-modal-content">
          {capturedPhoto ? (
            <div className="relative flex h-full w-full flex-col">
              <div className="flex flex-1 items-center justify-center bg-black">
                <IonImg
                  src={capturedPhoto}
                  alt="Ảnh sản phẩm vừa chụp"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-4">
                <IonFabButton
                  color="light"
                  onClick={() => setCapturedPhoto(null)}
                  disabled={isCapturing}
                  aria-label="Chụp lại"
                >
                  <IonIcon icon={refreshOutline} />
                </IonFabButton>
                <IonFabButton
                  color="success"
                  onClick={acceptPhoto}
                  disabled={isCapturing}
                  aria-label="Dùng ảnh này"
                >
                  {isCapturing
                    ? <IonSpinner name="crescent" />
                    : <IonIcon icon={checkmarkOutline} />}
                </IonFabButton>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full bg-black">
              <div
                ref={cameraContainerRef}
                className="relative h-full w-full overflow-hidden"
              />
              <div className="pointer-events-none absolute inset-0 z-10">
                <div
                  className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white/80"
                  style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)' }}
                />
              </div>

              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5">
                <IonFabButton
                  size="small"
                  color="light"
                  onClick={switchActiveCamera}
                  disabled={isCapturing}
                  aria-label="Đổi camera"
                >
                  <IonIcon icon={cameraReverseOutline} />
                </IonFabButton>
                <IonFabButton
                  color="primary"
                  onClick={capturePhoto}
                  disabled={isCapturing || !isStreamActive}
                  className="scale-110"
                  aria-label="Chụp ảnh"
                >
                  {isCapturing
                    ? <IonSpinner name="crescent" />
                    : <IonIcon icon={radioButtonOnOutline} />}
                </IonFabButton>
                {capabilities.torch && (
                  <IonFabButton
                    size="small"
                    color={torchEnabled ? 'warning' : 'light'}
                    onClick={() => toggleTorch()}
                    disabled={isCapturing}
                    aria-label="Bật hoặc tắt đèn flash"
                  >
                    <IonIcon
                      icon={torchEnabled
                        ? flashlightOutline
                        : flashOffOutline}
                    />
                  </IonFabButton>
                )}
              </div>

              {capabilities.zoom && (
                <div className="absolute right-5 top-5 z-20 w-52 rounded-full bg-black/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <IonIcon icon={searchOutline} className="text-white" />
                    <IonRange
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoomLevel}
                      onIonInput={(event) =>
                        setZoom(event.detail.value as number)}
                      className="flex-1"
                    />
                    <IonText className="min-w-8 text-xs text-white">
                      {zoomLevel.toFixed(1)}x
                    </IonText>
                  </div>
                </div>
              )}

              <IonText className="absolute left-5 top-5 z-20 rounded-full bg-black/70 px-3 py-2 text-xs text-white">
                {currentFacingMode === 'environment'
                  ? 'Camera sau'
                  : 'Camera trước'}
              </IonText>
            </div>
          )}
        </IonContent>
      </IonModal>
      <canvas ref={previewCanvasRef} className="hidden" />
    </>
  );
};
