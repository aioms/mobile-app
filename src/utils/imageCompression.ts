import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionError extends Error {
  code: 'UNSUPPORTED_FORMAT' | 'COMPRESSION_FAILED' | 'FILE_TOO_LARGE' | 'BROWSER_NOT_SUPPORTED';
}

// Supported image formats
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp'
];

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Default compression options
const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 2, // Target max size of 2MB
  maxWidthOrHeight: 1920, // Max dimension of 1920px
  useWebWorker: true,
  preserveExif: true,
  initialQuality: 0.8,
  alwaysKeepResolution: false
};

/**
 * Check if the file is a supported image format
 */
export const isSupportedImageFormat = (file: File): boolean => {
  return SUPPORTED_FORMATS.includes(file.type.toLowerCase());
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isSupportWebWorker = (): boolean => {
  return typeof Worker !== 'undefined';
}

/**
 * Check browser compatibility for image compression
 */
export const checkBrowserCompatibility = (): boolean => {
  try {
    // Check for basic File API support
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      return false;
    }
    
    // Check for Canvas API support (required for image compression)
    const canvas = document.createElement('canvas');
    if (!canvas.getContext) {
      return false;
    }
    
    // Check for Web Worker support (optional but recommended)
    if (!isSupportWebWorker()) {
      console.warn('Web Workers not supported, compression will run on main thread');
    }
    
    return true;
  } catch (error) {
    console.error('Browser compatibility check failed:', error);
    return false;
  }
};

/**
 * Compress an image file with comprehensive error handling
 */
export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  // Merge with default options
  const compressionOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate browser compatibility
  if (!checkBrowserCompatibility()) {
    const error: CompressionError = new Error(
      'Trình duyệt của bạn không hỗ trợ nén ảnh. Vui lòng sử dụng trình duyệt hiện đại hơn.'
    ) as CompressionError;
    error.code = 'BROWSER_NOT_SUPPORTED';
    throw error;
  }
  
  // Validate file type
  if (!isSupportedImageFormat(file)) {
    const error: CompressionError = new Error(
      `Định dạng ảnh không được hỗ trợ: ${file.type}. Vui lòng sử dụng JPEG, PNG, WebP hoặc BMP.`
    ) as CompressionError;
    error.code = 'UNSUPPORTED_FORMAT';
    throw error;
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const error: CompressionError = new Error(
      `Kích thước tệp quá lớn: ${formatFileSize(file.size)}. Kích thước tối đa cho phép là ${formatFileSize(MAX_FILE_SIZE)}.`
    ) as CompressionError;
    error.code = 'FILE_TOO_LARGE';
    throw error;
  }
  
  try {
    console.log(`Starting compression for ${file.name} (${formatFileSize(file.size)})`);
    
    // Configure compression options
    const imageCompressionOptions = {
      maxSizeMB: compressionOptions.maxSizeMB,
      maxWidthOrHeight: compressionOptions.maxWidthOrHeight,
      useWebWorker: compressionOptions.useWebWorker,
      preserveExif: compressionOptions.preserveExif,
      initialQuality: compressionOptions.initialQuality,
      alwaysKeepResolution: compressionOptions.alwaysKeepResolution,
      onProgress: compressionOptions.onProgress,
      fileType: file.type, // Preserve original file type
      maxIteration: 10
    };
    
    // Perform compression
    const compressedFile = await imageCompression(file, imageCompressionOptions);
    
    // Calculate compression statistics
    const originalSize = file.size;
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    
    console.log(`Compression completed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% reduction)`);
    
    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    };
    
  } catch (error) {
    // Handle specific compression errors
    if (error instanceof Error) {
      const compressionError: CompressionError = new Error(
        `Lỗi nén ảnh: ${error.message}`
      ) as CompressionError;
      compressionError.code = 'COMPRESSION_FAILED';
      throw compressionError;
    }
    
    // Handle unknown errors
    const compressionError: CompressionError = new Error(
      'Đã xảy ra lỗi không xác định khi nén ảnh'
    ) as CompressionError;
    compressionError.code = 'COMPRESSION_FAILED';
    throw compressionError;
  }
};

/**
 * Batch compress multiple images
 */
export const compressImages = async (
  files: File[], 
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress for batch processing
    if (options.onProgress) {
      options.onProgress((i / files.length) * 100);
    }
    
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Continue with other files even if one fails
      // You might want to collect errors and show them to user
    }
  }
  
  // Complete progress
  if (options.onProgress) {
    options.onProgress(100);
  }
  
  return results;
};

/**
 * Get compression recommendations based on file size and type
 */
export const getCompressionRecommendations = (file: File): CompressionOptions => {
  const sizeMB = file.size / (1024 * 1024);
  const isUseWebWorker = isSupportWebWorker();
  
  // Default recommendations
  let recommendations: CompressionOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    initialQuality: 0.8,
    useWebWorker: isUseWebWorker
  };
  
  // Adjust based on file size
  if (sizeMB > 10) {
    // Large files (>10MB) - more aggressive compression
    recommendations = {
      maxSizeMB: 3,
      maxWidthOrHeight: 1600,
      initialQuality: 0.7,
      useWebWorker: isUseWebWorker
    };
  } else if (sizeMB > 5) {
    // Medium files (5-10MB) - moderate compression
    recommendations = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1800,
      initialQuality: 0.8,
      useWebWorker: isUseWebWorker
    };
  } else if (sizeMB < 1) {
    // Small files (<1MB) - minimal compression
    recommendations = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.9,
      useWebWorker: isUseWebWorker
    };
  }
  
  // Adjust based on image type
  if (file.type === 'image/png') {
    // PNG files - be more conservative with quality
    recommendations.initialQuality = Math.min(recommendations.initialQuality || 0.8, 0.85);
  } else if (file.type === 'image/webp') {
    // WebP files - can handle more aggressive compression
    recommendations.initialQuality = Math.max(recommendations.initialQuality || 0.8, 0.75);
  }
  
  return recommendations;
};

export default {
  compressImage,
  compressImages,
  isSupportedImageFormat,
  checkBrowserCompatibility,
  formatFileSize,
  getCompressionRecommendations
};