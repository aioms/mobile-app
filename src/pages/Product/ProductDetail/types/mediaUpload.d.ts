import { CameraPhoto } from '@/hooks/useCamera';

export interface ImageMetadata {
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  fileName?: string;
  lastModified?: Date;
}

export interface EnhancedCameraPhoto extends CameraPhoto {
  metadata?: ImageMetadata;
}

export interface MediaUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onUpload?: (images: string[]) => Promise<boolean>;
  maxImages?: number;
  disabled?: boolean;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImageWithMetadata {
  dataUrl: string;
  metadata: ImageMetadata;
}