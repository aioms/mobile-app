import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, Photo, ImageOptions } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useIonToast } from '@ionic/react';
import { getMimeTypeFromDataURL, getDataURLFileSize } from '@/helpers/fileHelper';

export interface CameraPhoto {
  webPath?: string;
  format: string;
  saved: boolean;
  base64String?: string;
  dataUrl?: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
}

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  width?: number;
  height?: number;
}

export interface CameraStreamOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

export interface CameraCapabilities {
  torch?: boolean;
  zoom?: boolean;
  focusMode?: boolean;
  exposureMode?: boolean;
}

export interface UseCamera {
  // Existing methods
  isLoading: boolean;
  error: string | null;
  takePhoto: (options?: CameraOptions) => Promise<CameraPhoto | null>;
  selectFromGallery: (options?: CameraOptions) => Promise<CameraPhoto | null>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  clearError: () => void;
  
  // New PWA camera stream methods
  isStreamActive: boolean;
  currentFacingMode: 'user' | 'environment';
  capabilities: CameraCapabilities;
  torchEnabled: boolean;
  zoomLevel: number;
  
  startCameraStream: (options?: CameraStreamOptions) => Promise<MediaStream | null>;
  stopCameraStream: () => void;
  switchCamera: () => Promise<void>;
  captureFromStream: (canvas?: HTMLCanvasElement) => Promise<CameraPhoto | null>;
  toggleTorch: () => Promise<void>;
  setZoom: (level: number) => Promise<void>;
  getVideoElement: () => HTMLVideoElement | null;
}

const useCamera = (): UseCamera => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentToast] = useIonToast();

  // Helper function to extract metadata from data URL
  const extractMetadataFromDataUrl = useCallback((dataUrl: string): { mimeType: string; fileSize: number } => {
    try {
      const mimeType = getMimeTypeFromDataURL(dataUrl);
      const fileSize = getDataURLFileSize(dataUrl);
      return { mimeType, fileSize };
    } catch (error) {
      console.error('Error extracting metadata from data URL:', error);
      return { mimeType: 'image/jpeg', fileSize: 0 };
    }
  }, []);

  // Helper function to create file input for web gallery selection
  const createFileInput = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      // Remove existing input if any
      const existingInput = document.getElementById('camera-gallery-input') as HTMLInputElement;
      if (existingInput) {
        existingInput.remove();
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.id = 'camera-gallery-input';
      input.accept = 'image/*';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0] || null;
        if (file) {
          resolve(file);
        } else {
          resolve(null);
        }
        // Clean up
        setTimeout(() => input.remove(), 100);
      };

      input.oncancel = () => {
        resolve(null);
        setTimeout(() => input.remove(), 100);
      };

      document.body.appendChild(input);
      input.click();
    });
  }, []);

  // Helper function to convert File to CameraPhoto with metadata
  const fileToCameraPhoto = useCallback(async (file: File): Promise<CameraPhoto> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const photo: CameraPhoto = {
            dataUrl,
            webPath: dataUrl,
            format: file.type.split('/')[1] || 'jpeg',
            saved: false,
            mimeType: file.type,
            fileSize: file.size,
            fileName: file.name
          };
          resolve(photo);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }, []);

  // New PWA camera stream state
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Refs for camera stream management
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced permission checking with MediaDevices API
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, check MediaDevices API support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API không được hỗ trợ trên trình duyệt này');
        }
        
        // Check if we can enumerate devices (indicates permission)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          return videoDevices.length > 0;
        } catch {
          // If enumeration fails, we'll try to request permission
          return true;
        }
      }

      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (err) {
      console.error('Error checking camera permissions:', err);
      setError('Không thể kiểm tra quyền truy cập camera');
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, request camera permission through getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          // Stop the stream immediately as we just wanted to check permission
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            setError('Cần cấp quyền truy cập camera để sử dụng tính năng này');
            presentToast({
              message: 'Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt',
              duration: 3000,
              position: 'top',
              color: 'warning'
            });
          } else if (err.name === 'NotFoundError') {
            setError('Không tìm thấy camera trên thiết bị');
          } else {
            setError('Không thể truy cập camera');
          }
          return false;
        }
      }

      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });

      const granted = permissions.camera === 'granted' && permissions.photos === 'granted';
      
      if (!granted) {
        setError('Cần cấp quyền truy cập camera và thư viện ảnh để sử dụng tính năng này');
        presentToast({
          message: 'Vui lòng cấp quyền truy cập camera trong cài đặt ứng dụng',
          duration: 3000,
          position: 'top',
          color: 'warning'
        });
      }

      return granted;
    } catch (err) {
      console.error('Error requesting camera permissions:', err);
      setError('Không thể yêu cầu quyền truy cập camera');
      return false;
    }
  }, [presentToast]);

  // Get camera capabilities
  const getCameraCapabilities = useCallback((track: MediaStreamTrack): CameraCapabilities => {
    const capabilities = track.getCapabilities();
    return {
      torch: 'torch' in capabilities,
      zoom: 'zoom' in capabilities,
      focusMode: 'focusMode' in capabilities,
      exposureMode: 'exposureMode' in capabilities,
    };
  }, []);

  // Start camera stream with enhanced options
  const startCameraStream = useCallback(async (options?: CameraStreamOptions): Promise<MediaStream | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check permissions first
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          return null;
        }
      }

      // Stop existing stream if any
      if (streamRef.current) {
        stopCameraStream();
      }

      const facingMode = options?.facingMode || currentFacingMode;
      
      // Enhanced camera constraints for product photography
       const constraints: MediaStreamConstraints = {
         video: {
           facingMode: { ideal: facingMode },
           width: { 
             ideal: options?.width || 1920, 
             min: 1280 
           },
           height: { 
             ideal: options?.height || 1080, 
             min: 720 
           },
           frameRate: { ideal: 30, min: 15 }
         },
         audio: false
       };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        console.error('Camera access failed with ideal constraints:', err);
        
        // Fallback to basic constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false
          });
        } catch (fallbackErr) {
          throw new Error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
      }

      streamRef.current = stream;
      setIsStreamActive(true);
      setCurrentFacingMode(facingMode);

      // Get camera capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = getCameraCapabilities(videoTrack);
        setCapabilities(caps);
      }

      // Create or update video element
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
        `;
        videoRef.current = video;
      }

      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const video = videoRef.current!;
        video.onloadedmetadata = () => resolve(void 0);
        video.onerror = () => reject(new Error('Video failed to load'));
        setTimeout(() => reject(new Error('Video load timeout')), 10000);
      });

      await videoRef.current.play();

      return stream;
    } catch (err: any) {
      console.error('Error starting camera stream:', err);
      setError(err.message || 'Có lỗi xảy ra khi khởi động camera');
      
      presentToast({
        message: err.message || 'Không thể khởi động camera',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions, requestPermissions, currentFacingMode, getCameraCapabilities, presentToast]);

  // Stop camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreamActive(false);
    setTorchEnabled(false);
    setZoomLevel(1);
  }, []);

  // Switch between front and rear cameras
  const switchCamera = useCallback(async (): Promise<void> => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    if (isStreamActive) {
      await startCameraStream({ facingMode: newFacingMode });
    } else {
      setCurrentFacingMode(newFacingMode);
    }
  }, [currentFacingMode, isStreamActive, startCameraStream]);

  // Capture photo from stream with high quality
  const captureFromStream = useCallback(async (canvas?: HTMLCanvasElement): Promise<CameraPhoto | null> => {
    try {
      if (!videoRef.current || !streamRef.current) {
        throw new Error('Camera stream not active');
      }

      const video = videoRef.current;
      const targetCanvas = canvas || canvasRef.current;

      if (!targetCanvas) {
        // Create canvas if not provided
        const newCanvas = document.createElement('canvas');
        canvasRef.current = newCanvas;
        return captureFromStream(newCanvas);
      }

      // Set canvas size to video dimensions for best quality
      targetCanvas.width = video.videoWidth;
      targetCanvas.height = video.videoHeight;

      const ctx = targetCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, targetCanvas.width, targetCanvas.height);

      // Convert to high-quality JPEG
      const dataUrl = targetCanvas.toDataURL('image/jpeg', 0.9);
      
      // Create photo object
      const photo: CameraPhoto = {
        dataUrl,
        format: 'jpeg',
        saved: false,
        webPath: dataUrl
      };

      return photo;
    } catch (err: any) {
      console.error('Error capturing from stream:', err);
      setError(err.message || 'Có lỗi xảy ra khi chụp ảnh');
      
      presentToast({
        message: err.message || 'Không thể chụp ảnh',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      
      return null;
    }
  }, [presentToast]);

  // Toggle torch/flash
  const toggleTorch = useCallback(async (): Promise<void> => {
    try {
      if (!streamRef.current || !capabilities.torch) {
        throw new Error('Torch not supported');
      }

      const videoTrack = streamRef.current.getVideoTracks()[0];
      const newTorchState = !torchEnabled;

      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });

      setTorchEnabled(newTorchState);

      // presentToast({
      //   message: newTorchState ? 'Đã bật đèn flash' : 'Đã tắt đèn flash',
      //   duration: 1500,
      //   position: 'bottom',
      //   color: 'success'
      // });
    } catch (err: any) {
      console.error('Error toggling torch:', err);
      presentToast({
        message: 'Không thể điều khiển đèn flash',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
    }
  }, [streamRef, capabilities.torch, torchEnabled, presentToast]);

  // Set zoom level
  const setZoom = useCallback(async (level: number): Promise<void> => {
    try {
      if (!streamRef.current || !capabilities.zoom) {
        throw new Error('Zoom not supported');
      }

      const videoTrack = streamRef.current.getVideoTracks()[0];
      const trackCapabilities = videoTrack.getCapabilities();
      
      // Clamp zoom level to supported range
      const minZoom = (trackCapabilities as any).zoom?.min || 1;
      const maxZoom = (trackCapabilities as any).zoom?.max || 3;
      const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level));

      await videoTrack.applyConstraints({
        advanced: [{ zoom: clampedLevel } as any]
      });

      setZoomLevel(clampedLevel);
    } catch (err: any) {
      console.error('Error setting zoom:', err);
      presentToast({
        message: 'Không thể điều chỉnh zoom',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
    }
  }, [streamRef, capabilities.zoom, presentToast]);

  // Get video element reference
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return videoRef.current;
  }, []);

  const processPhoto = useCallback((photo: Photo): CameraPhoto => {
    const processedPhoto: CameraPhoto = {
      webPath: photo.webPath,
      format: photo.format,
      saved: photo.saved || false,
      base64String: photo.base64String,
      dataUrl: photo.dataUrl
    };

    // Extract metadata from data URL if available
    if (photo.dataUrl) {
      const { mimeType, fileSize } = extractMetadataFromDataUrl(photo.dataUrl);
      processedPhoto.mimeType = mimeType;
      processedPhoto.fileSize = fileSize;
      processedPhoto.fileName = `image_${Date.now()}.${photo.format}`;
    }

    return processedPhoto;
  }, [extractMetadataFromDataUrl]);

  const takePhoto = useCallback(async (options?: CameraOptions): Promise<CameraPhoto | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check and request permissions
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          return null;
        }
      }

      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        ...options
      };

      const photo = await Camera.getPhoto(defaultOptions);
      if (!photo) {
        throw new Error('Không thể chụp ảnh');
      }

      return processPhoto(photo);
    } catch (err: any) {
      console.error('Error taking photo:', err);
      
      if (err.message?.includes('User cancelled')) {
        // User cancelled, don't show error
        return null;
      }
      
      const errorMessage = err.message || 'Có lỗi xảy ra khi chụp ảnh';
      setError(errorMessage);
      
      presentToast({
        message: errorMessage,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions, requestPermissions, processPhoto, presentToast]);

  const selectFromGallery = useCallback(async (options?: CameraOptions): Promise<CameraPhoto | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check and request permissions
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Không có quyền truy cập vào thư viện ảnh');
        }
      }

      // For web platform, use custom file input to get File object with metadata
      if (!Capacitor.isNativePlatform()) {
        const file = await createFileInput();
        if (!file) {
          throw new Error('Không thể chọn ảnh');
        }
        
        // Convert File to CameraPhoto with metadata
        const photo = await fileToCameraPhoto(file);
        
        // Apply quality and dimension options if specified
        if (options?.quality || options?.width || options?.height) {
          // For web, we can apply additional processing here if needed
          // For now, we'll return the photo with original metadata
        }
        
        return photo;
      }

      // For native platforms, use Capacitor Camera API
      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024,
        ...options
      };

      const photo = await Camera.getPhoto(defaultOptions);
      if (!photo) {
        throw new Error('Không thể chọn ảnh');
      }

      const processedPhoto = processPhoto(photo);
      
      // Extract metadata from data URL for native platforms
      if (processedPhoto.dataUrl) {
        const { mimeType, fileSize } = extractMetadataFromDataUrl(processedPhoto.dataUrl);
        processedPhoto.mimeType = mimeType;
        processedPhoto.fileSize = fileSize;
        processedPhoto.fileName = `image_${Date.now()}.${processedPhoto.format}`;
      }

      return processedPhoto;
    } catch (err: any) {
      console.error('Error selecting photo:', err);
      
      if (err.message?.includes('User cancelled')) {
        // User cancelled, don't show error
        return null;
      }
      
      const errorMessage = err.message || 'Có lỗi xảy ra khi chọn ảnh';
      setError(errorMessage);
      
      presentToast({
        message: errorMessage,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions, requestPermissions, processPhoto, presentToast, createFileInput, fileToCameraPhoto, extractMetadataFromDataUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
    };
  }, [stopCameraStream]);

  return {
    // Existing methods
    isLoading,
    error,
    takePhoto,
    selectFromGallery,
    checkPermissions,
    requestPermissions,
    clearError,
    
    // New PWA camera stream methods
    isStreamActive,
    currentFacingMode,
    capabilities,
    torchEnabled,
    zoomLevel,
    
    startCameraStream,
    stopCameraStream,
    switchCamera,
    captureFromStream,
    toggleTorch,
    setZoom,
    getVideoElement
  };
};

export default useCamera;