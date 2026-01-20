/**
 * File helper utilities for handling file operations
 */

export const getS3ImageUrl = (path: string) => {
  if (!path) return "";

  // Check if path start with http, if so, return path as is
  if (path.startsWith("http")) {
    return path;
  }

  return `${import.meta.env.VITE_S3_URL}/${import.meta.env.VITE_S3_BUCKET}/${path}`;
};

/**
 * Converts a data URL to a File object
 *
 * @param dataUrl - The data URL string (e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRg...")
 * @param fileName - The desired filename for the File object
 * @returns A File object created from the data URL
 * @throws Error if the data URL format is invalid
 *
 * @example
 * ```typescript
 * const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";
 * const file = dataURLtoFile(dataUrl, "photo.jpg");
 * console.log(file.name); // "photo.jpg"
 * console.log(file.type); // "image/jpeg"
 * console.log(file.size); // File size in bytes
 * ```
 */
export const dataURLtoFile = (dataUrl: string, fileName: string): File => {
  try {
    // Split the data URL to extract metadata and base64 data
    const arr = dataUrl.split(",");

    // Validate data URL format
    if (arr.length !== 2) {
      throw new Error("Invalid data URL format");
    }

    // Extract MIME type from the data URL header
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch?.[1] || "image/jpeg";

    // Decode base64 string to binary
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    // Convert binary string to byte array
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // Create and return File object
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    // Provide more descriptive error message
    if (error instanceof Error) {
      if (error.message.includes("Invalid data URL format")) {
        throw new Error(
          `Invalid data URL format: ${dataUrl.substring(0, 50)}...`,
        );
      }
      if (error.message.includes("atob")) {
        throw new Error("Failed to decode base64 data from data URL");
      }
    }
    throw new Error(
      `Failed to convert data URL to File: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Extracts MIME type from a data URL
 *
 * @param dataUrl - The data URL string
 * @returns The MIME type (e.g., "image/jpeg", "image/png")
 * @throws Error if the data URL format is invalid
 *
 * @example
 * ```typescript
 * const mimeType = getMimeTypeFromDataURL("data:image/png;base64,iVBORw0KGgo...");
 * console.log(mimeType); // "image/png"
 * ```
 */
export const getMimeTypeFromDataURL = (dataUrl: string): string => {
  const match = dataUrl.match(/data:(.*?);base64,/);
  if (!match) {
    throw new Error("Invalid data URL format");
  }
  return match[1] || "image/jpeg";
};

/**
 * Calculates the approximate file size of a data URL in bytes
 *
 * @param dataUrl - The data URL string
 * @returns The approximate size in bytes
 *
 * @example
 * ```typescript
 * const size = getDataURLFileSize("data:image/jpeg;base64,/9j/4AAQSkZJRg...");
 * console.log(size); // 1024 (approximate size in bytes)
 * ```
 */
export const getDataURLFileSize = (dataUrl: string): number => {
  const base64String = dataUrl.split(",")[1];
  if (!base64String) {
    return 0;
  }
  // Calculate approximate size: base64 length * 3/4 (since base64 encodes 3 bytes as 4 characters)
  return Math.round((base64String.length * 3) / 4);
};

