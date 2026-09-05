import React, { useRef, useEffect, useState } from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonToast
} from '@ionic/react';
import { closeOutline, downloadOutline, shareSocialOutline } from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Zoom, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ImagePreviewProps } from './types/imagePreview';
import {
  canShareFiles,
  downloadImageFromUrl,
  shareImageFromUrl,
  sanitizeFileName
} from '@/helpers/imageDownloadHelper';

import 'swiper/css';
import 'swiper/css/zoom';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ImagePreview.css';

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  fileNamePrefix
}) => {
  const swiperRef = useRef<SwiperType>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [presentToast] = useIonToast();

  useEffect(() => {
    setCanShare(canShareFiles());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(initialIndex);
      if (swiperRef.current) {
        swiperRef.current.slideTo(initialIndex, 0);
      }
    }
  }, [isOpen, initialIndex]);

  const getCurrentFileName = () => {
    const currentUrl = images[currentSlideIndex] || images[0] || '';
    const extension = currentUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const cleanExt = extension.length <= 4 && extension.length >= 3 ? extension : 'jpg';
    const safePrefix = sanitizeFileName(fileNamePrefix || 'san_pham');
    return `${safePrefix}_${currentSlideIndex + 1}.${cleanExt}`;
  };

  const handleDownload = async () => {
    const currentUrl = images[currentSlideIndex] || images[0];
    if (!currentUrl || isActionLoading) return;

    setIsActionLoading(true);
    try {
      const fileName = getCurrentFileName();
      await downloadImageFromUrl(currentUrl, fileName);
      presentToast({
        message: 'Đã tải ảnh về thiết bị',
        duration: 2000,
        position: 'top',
        color: 'success'
      });
    } catch (error) {
      console.error('Download error:', error);
      presentToast({
        message: 'Không thể tải ảnh, vui lòng thử lại',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShare = async () => {
    const currentUrl = images[currentSlideIndex] || images[0];
    if (!currentUrl || isActionLoading) return;

    setIsActionLoading(true);
    try {
      const fileName = getCurrentFileName();
      const shared = await shareImageFromUrl(
        currentUrl,
        fileName,
        fileNamePrefix || 'Hình ảnh sản phẩm'
      );
      if (shared) {
        presentToast({
          message: 'Đã mở chia sẻ ảnh',
          duration: 1500,
          position: 'top',
          color: 'success'
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      presentToast({
        message: 'Không thể chia sẻ ảnh, vui lòng thử lại',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="image-preview-modal"
    >
      <IonContent className="ion-no-padding" scrollY={false}>
        <div style={{ position: 'relative', height: '100%', width: '100%', backgroundColor: '#000' }}>
          <div className="preview-top-actions">
            {canShare && (
              <IonButton
                fill="clear"
                className="preview-action-button"
                onClick={handleShare}
                disabled={isActionLoading}
                aria-label="Chia sẻ ảnh"
              >
                <IonIcon icon={shareSocialOutline} size="large" />
              </IonButton>
            )}

            <IonButton
              fill="clear"
              className="preview-action-button"
              onClick={handleDownload}
              disabled={isActionLoading}
              aria-label="Tải ảnh"
            >
              {isActionLoading ? (
                <IonSpinner name="crescent" style={{ width: '22px', height: '22px', color: '#fff' }} />
              ) : (
                <IonIcon icon={downloadOutline} size="large" />
              )}
            </IonButton>

            <IonButton
              fill="clear"
              className="preview-action-button"
              onClick={onClose}
              aria-label="Đóng"
            >
              <IonIcon icon={closeOutline} size="large" />
            </IonButton>
          </div>

          <Swiper
            modules={[Zoom, Navigation, Pagination]}
            zoom={{
              maxRatio: 3,
              minRatio: 1
            }}
            navigation
            pagination={{ clickable: true, type: 'fraction' }}
            initialSlide={initialIndex}
            className="image-preview-swiper"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setCurrentSlideIndex(swiper.activeIndex);
            }}
          >
            {images.map((img, index) => (
              <SwiperSlide key={index}>
                <div className="swiper-zoom-container">
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </IonContent>
    </IonModal>
  );
};
