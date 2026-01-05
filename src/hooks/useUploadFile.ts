import { useCallback, useEffect, useRef, useState } from "react";
import { request } from "../helpers/axios";
import { IHttpResponse } from "@/types";
import { useIonToast } from "@ionic/react";
import {
  SignedUrlRequest,
  SignedUrlResponse,
  UploadFileOptions,
  UseUploadFileReturn,
} from "@/types/uploadFile";
import {
  compressImage,
  CompressionError,
  CompressionResult,
  getCompressionRecommendations,
  isSupportedImageFormat,
} from "@/helpers/imageCompression";

const useUploadFile = (): UseUploadFileReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SignedUrlResponse | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [presentToast] = useIonToast();

  // Cleanup function to abort pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    options?: UploadFileOptions,
  ): Promise<SignedUrlResponse | null> => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Validate file
      if (!file) {
        throw new Error("File is required");
      }

      if (file.size === 0) {
        throw new Error("File cannot be empty");
      }

      let processedFile = file;
      let compressionResult: CompressionResult | null = null;

      // Apply image compression if enabled and file is an image
      if (options?.enableCompression && isSupportedImageFormat(file)) {
        try {
          console.log("Starting image compression for:", file.name);

          // Get compression recommendations based on file characteristics
          const recommendations = getCompressionRecommendations(file);

          // Merge user options with recommendations
          const compressionOptions = {
            ...recommendations,
            ...options.compressionOptions,
            onProgress: (progress: number) => {
              console.log(`Compression progress: ${progress}%`);
              if (options.compressionOptions?.onProgress) {
                options.compressionOptions.onProgress(progress);
              }
            },
          };

          // Compress the image
          compressionResult = await compressImage(file, compressionOptions);
          processedFile = compressionResult.file;

          console.log(
            `Image compressed: ${
              compressionResult.compressionRatio.toFixed(1)
            }% reduction`,
          );

          // Show compression info toast
          presentToast({
            message: `Ảnh đã được nén: ${
              compressionResult.compressionRatio.toFixed(1)
            }% giảm dung lượng`,
            duration: 2000,
            position: "top",
            color: "primary",
          });
        } catch (compressionError) {
          console.warn(
            "Image compression failed, using original file:",
            compressionError,
          );
          // If compression fails, continue with original file
          // Don't throw error, just log it and proceed
          processedFile = file;
        }
      }

      // Prepare request body with potentially compressed file info
      const requestBody: SignedUrlRequest = {
        fileName: processedFile.name || file.name,
        fileSize: processedFile.size || file.size,
        mimeType: processedFile.type || file.type || "application/octet-stream",
      };

      console.log("Requesting signed URL for file:", {
        originalFile: file.name,
        originalSize: file.size,
        processedFile: processedFile.name,
        processedSize: processedFile.size,
        compressionRatio: compressionResult
          ? `${compressionResult.compressionRatio.toFixed(1)}%`
          : "N/A",
        mimeType: requestBody.mimeType,
      });

      // Get signed URL from API
      const response: IHttpResponse<SignedUrlResponse> = await request.post(
        "/files/signed-url",
        requestBody,
        {
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to get signed URL");
      }

      if (!response.data) {
        throw new Error("No signed URL received from server");
      }

      console.log("Received signed URL response:", response.data);

      // Upload file to S3 using signed URL
      const uploadResponse = await fetch(response.data.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": processedFile.type || "application/octet-stream",
          "Content-Length": processedFile.size.toString(),
          "x-amz-acl": "public-read", // Set ACL to public-read to make file publicly accessible
        },
        body: processedFile,
        signal: abortControllerRef.current.signal,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      console.log("File uploaded successfully to S3");

      // Set success data
      setData(response.data);

      // Call success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(response.data);
      }

      // Show success toast with compression info if applicable
      const successMessage = compressionResult
        ? `Tệp ${file.name} đã được tải lên thành công (${
          compressionResult.compressionRatio.toFixed(1)
        }% nén)`
        : `Tệp ${processedFile.name} (${response.data.type}) đã được tải lên thành công`;

      presentToast({
        message: successMessage,
        duration: 2000,
        position: "top",
        color: "success",
      });

      return response.data;
    } catch (err) {
      let errorMessage = "Unknown error occurred";
      let isCompressionError = false;

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Upload cancelled";
        } else {
          errorMessage = err.message;

          // Check if this is a compression error
          if ("code" in err && (err as CompressionError).code) {
            isCompressionError = true;
            const compressionError = err as CompressionError;

            switch (compressionError.code) {
              case "UNSUPPORTED_FORMAT":
                errorMessage =
                  "Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG, WebP hoặc BMP.";
                break;
              case "FILE_TOO_LARGE":
                errorMessage =
                  "Tệp quá lớn. Vui lòng chọn ảnh có kích thước nhỏ hơn 50MB.";
                break;
              case "BROWSER_NOT_SUPPORTED":
                errorMessage =
                  "Trình duyệt không hỗ trợ nén ảnh. Ảnh sẽ được tải lên mà không nén.";
                break;
              case "COMPRESSION_FAILED":
                errorMessage =
                  "Nén ảnh thất bại. Ảnh sẽ được tải lên mà không nén.";
                break;
              default:
                errorMessage = "Lỗi xử lý ảnh: " + err.message;
            }
          }
        }
      }

      setError(errorMessage);
      console.error("Upload file error:", err);

      // Call error callback if provided
      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }

      // Show error toast - use different message for compression errors
      const toastMessage = isCompressionError
        ? errorMessage
        : `Lỗi khi tải lên tệp: ${errorMessage}`;

      presentToast({
        message: toastMessage,
        duration: isCompressionError ? 4000 : 3000,
        position: "top",
        color: isCompressionError ? "warning" : "danger",
      });

      return null;
    } finally {
      setIsLoading(false);
      // Clear abort controller after request completes
      abortControllerRef.current = null;
    }
  }, []);

  return {
    uploadFile,
    isLoading,
    error,
    data,
    clearError,
  };
};

export default useUploadFile;
