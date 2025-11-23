export interface SignedUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  filePath: string;
  fileId: string;
  type: string;
}

export interface UploadFileOptions {
  onSuccess?: (response: SignedUrlResponse) => void;
  onError?: (error: Error) => void;
  enableCompression?: boolean;
  compressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    preserveExif?: boolean;
    onProgress?: (progress: number) => void;
  };
}

export interface UseUploadFileReturn {
  uploadFile: (file: File, options?: UploadFileOptions) => Promise<SignedUrlResponse | null>;
  isLoading: boolean;
  error: string | null;
  data: SignedUrlResponse | null;
  clearError: () => void;
}