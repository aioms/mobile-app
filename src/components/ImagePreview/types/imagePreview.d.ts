export interface ImagePreviewProps {
  /**
   * Array of image URLs to display
   */
  images: string[];
  /**
   * Index of the image to show initially
   */
  initialIndex?: number;
  /**
   * Controls the visibility of the preview modal
   */
  isOpen: boolean;
  /**
   * Callback function when the preview is closed
   */
  onClose: () => void;
  /**
   * Optional prefix for file names when downloading/sharing (e.g. product name)
   */
  fileNamePrefix?: string;
}
