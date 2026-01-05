import React, { useState } from 'react';
import {
    IonIcon,
    IonImg,
    IonButton,
    IonSpinner,
    IonProgressBar,
    IonText,
    IonAlert,
    useIonToast
} from '@ionic/react';
import {
    cameraOutline,
    trashOutline,
    checkmarkOutline
} from 'ionicons/icons';

import useCamera, { CameraOptions } from '@/hooks/useCamera';
import useUploadFile from '@/hooks/useUploadFile';
import { dataURLtoFile, getDataURLFileSize, getS3ImageUrl } from '@/helpers/fileHelper';
import { ImagePreview } from '@/components/ImagePreview/ImagePreview';

interface ProductImage {
    id: string;
    path: string;
}

interface ProductImageUploadProps {
    images: ProductImage[];
    onImagesChange: (images: ProductImage[]) => void;
    maxImages?: number;
    disabled?: boolean;
}

const MAX_IMAGES = 5;
const VALIDATION_RULES = {
    IMAGES: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }
};

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
    images = [],
    onImagesChange,
    maxImages = MAX_IMAGES,
    disabled = false
}) => {
    const [presentToast] = useIonToast();
    const { takePhoto, isLoading: cameraLoading } = useCamera();
    const { uploadFile } = useUploadFile();

    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [isCompressing, setIsCompressing] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const handleTakePhoto = async () => {
        // Check if we've reached the maximum number of images
        if (images.length >= maxImages) {
            presentToast({
                message: `Chỉ được tải lên tối đa ${maxImages} hình ảnh`,
                duration: 3000,
                position: 'top',
                color: 'warning'
            });
            return;
        }

        try {
            const options: CameraOptions = {
                quality: 90,
                allowEditing: true,
                width: 1920,
                height: 1920
            };

            const photo = await takePhoto(options);

            if (photo?.dataUrl) {
                // Extract metadata if available
                const mimeType = photo.mimeType || `image/${photo.format}`;
                const fileSize = photo.fileSize || getDataURLFileSize(photo.dataUrl);
                const fileName = photo.fileName || `product_${Date.now()}.${photo.format}`;

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
    };

    const handleUploadImage = async (imageData: string, fileName: string, fileSize: number) => {
        const file = dataURLtoFile(imageData, fileName);

        setCompressionProgress(0);
        setIsCompressing(false);

        await uploadFile(file, {
            enableCompression: true,
            compressionOptions: {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                preserveExif: true,
                onProgress: (progress: number) => {
                    setCompressionProgress(progress);
                    setIsCompressing(progress > 0 && progress < 100);
                }
            },
            onSuccess: async (response) => {
                const { fileId, filePath } = response;

                setTimeout(() => {
                    const newImages = [...images, { id: fileId, path: filePath }];
                    onImagesChange(newImages);

                    setCompressionProgress(0);
                    setIsCompressing(false);
                }, 500);
            },
            onError: (error) => {
                setCompressionProgress(0);
                setIsCompressing(false);

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
            {/* Product Image Upload Area */}
            <div className="mb-6">
                {images.length > 0 ? (
                    <>
                        {/* Image Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {images.map((image, index) => (
                                <div
                                    key={index}
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
                                    className="aspect-square border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 transition-colors"
                                    onClick={handleTakePhoto}
                                    disabled={isCompressing || cameraLoading}
                                >
                                    {isCompressing || cameraLoading ? (
                                        <IonSpinner name="crescent" color="primary" />
                                    ) : (
                                        <>
                                            <IonIcon
                                                icon={cameraOutline}
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
                        className="w-full h-48 border-2 border-dashed border-teal-300 rounded-lg flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 transition-colors"
                        onClick={handleTakePhoto}
                        disabled={disabled || isCompressing || cameraLoading}
                    >
                        {isCompressing || cameraLoading ? (
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
                                <p className="text-teal-500 text-sm mt-1">Nhấn để chụp ảnh</p>
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

                {/* Compression Info */}
                <IonText color="medium">
                    <p className="text-center mt-2 text-xs">
                        <IonIcon icon={checkmarkOutline} className="align-middle" /> Ảnh sẽ được tự động nén để tối ưu dung lượng
                    </p>
                </IonText>
            </div>

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
                images={images.map(img => getS3ImageUrl(img.path))}
                initialIndex={previewIndex}
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
            />
        </>
    );
};
