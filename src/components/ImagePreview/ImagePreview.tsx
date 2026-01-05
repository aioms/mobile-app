import React, { useRef, useEffect } from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Zoom, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ImagePreviewProps } from './types/imagePreview';

import 'swiper/css';
import 'swiper/css/zoom';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ImagePreview.css';

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose
}) => {
  const swiperRef = useRef<SwiperType>();

  useEffect(() => {
    if (isOpen && swiperRef.current) {
      // Ensure we jump to the correct slide without animation when opening
      swiperRef.current.slideTo(initialIndex, 0);
    }
  }, [isOpen, initialIndex]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="image-preview-modal"
    >
      <IonContent className="ion-no-padding" scrollY={false}>
        <div style={{ position: 'relative', height: '100%', width: '100%', backgroundColor: '#000' }}>
          <IonButton
            fill="clear"
            className="preview-close-button"
            onClick={onClose}
          >
            <IonIcon icon={closeOutline} size="large" />
          </IonButton>

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
