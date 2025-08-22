import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarcodeScanner,
  BarcodeFormat,
} from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { sleep } from "@/helpers/common";

interface UseBarcodeScanner {
  onBarcodeScanned: (value: string, data?: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  onStop?: () => void;
  formats?: BarcodeFormat[];
  scanThreshold?: number;
  enableTorch?: boolean;
  enableZoom?: boolean;
  toastTimeout?: number;
  delay?: number;
}

interface ScannerState {
  isScanning: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  torchEnabled: boolean;
  zoomLevel: number;
}

export const useBarcodeScanner = ({
  onBarcodeScanned,
  onError,
  onStop,
  formats = [
    BarcodeFormat.Code128,
    BarcodeFormat.QrCode,
    BarcodeFormat.Ean13,
    BarcodeFormat.Code39,
  ],
  scanThreshold = 1000,
  enableTorch = true,
  enableZoom = true,
  toastTimeout = 2000,
  delay = 2000,
}: UseBarcodeScanner) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listenerRef = useRef<any>(null);
  const lastScannedCode = useRef<string>("");
  const lastScannedTime = useRef<number>(0);
  const scanCount = useRef<number>(0);
  const detectionLoopRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scannerState, setScannerState] = useState<ScannerState>({
    isScanning: false,
    isInitialized: false,
    hasPermission: false,
    torchEnabled: false,
    zoomLevel: 1,
  });

  // Enhanced DOM manipulation for scanner UI
  const updateDOMForOpenCamera = useCallback(() => {
    // Create scanner overlay with enhanced UI
    const scannerOverlay = document.createElement("div");
    scannerOverlay.className = "scanner-overlay";
    scannerOverlay.innerHTML = `
      <div class="barcode-frame">
        <div class="barcode-frame-corners"></div>
        <div class="scan-line"></div>
      </div>
      <div class="scanner-controls">
        <ion-fab vertical="bottom" horizontal="start" slot="fixed" class="scanner-torch-button" ${
          !enableTorch ? 'style="display: none;"' : ""
        }>
          <ion-fab-button color="light" onclick="window.toggleTorch()">
            <ion-icon name="flashlight"></ion-icon>
          </ion-fab-button>
        </ion-fab>
        <ion-fab vertical="bottom" horizontal="center" slot="fixed" class="scanner-stop-button">
          <ion-fab-button color="danger" onclick="window.stopScanner()">
            <ion-icon name="stop"></ion-icon>
          </ion-fab-button>
        </ion-fab>
        <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="scanner-zoom-button" ${
          !enableZoom ? 'style="display: none;"' : ""
        }>
          <ion-fab-button color="light" onclick="window.toggleZoom()">
            <ion-icon name="search"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </div>
      <div class="scanner-info">
        <p style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: white; text-align: center; z-index: 10000; margin: 0; padding: 8px 16px; background: rgba(0,0,0,0.7); border-radius: 20px; font-size: 14px;">
          Position barcode within the frame
        </p>
      </div>
    `;
    document.body.appendChild(scannerOverlay);

    // Add global functions
    (window as any).stopScanner = () => stopScan();
    (window as any).toggleTorch = () => toggleTorch();
    (window as any).toggleZoom = () => toggleZoom();

    // Apply scanner styles
    document.querySelector("body")?.classList.add("scanner-active");
    document.querySelector("ion-content")?.classList.add("scanner-active");
    document.querySelector("ion-app")?.classList.add("scanner-active");

    // Hide UI elements
    const elements = document.querySelectorAll(
      "ion-header, ion-footer, ion-toolbar, ion-content > *:not(.scanner-overlay):not(.scanner-stop-button)"
    );
    elements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  }, [formats, enableTorch, enableZoom]);

  const updateDOMForCloseCamera = useCallback(() => {
    // Remove scanner overlay and controls
    const scannerOverlay = document.querySelector(".scanner-overlay");
    scannerOverlay?.remove();

    // Remove scanner-active classes
    document.querySelector("body")?.classList.remove("scanner-active");
    document.querySelector("ion-content")?.classList.remove("scanner-active");
    document.querySelector("ion-app")?.classList.remove("scanner-active");

    // Show all UI elements again
    const elements = document.querySelectorAll(
      "ion-header, ion-footer, ion-toolbar, ion-content > *"
    );
    elements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });

    // Clean up global functions
    delete (window as any).stopScanner;
    delete (window as any).toggleTorch;
    delete (window as any).toggleZoom;
  }, []);

  // Enhanced permission checking
  const checkPermissions = async (): Promise<boolean> => {
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        throw new Error("Barcode scanning is not supported on this device");
      }

      const permissionStatus = await BarcodeScanner.checkPermissions();

      if (permissionStatus.camera === "denied") {
        const requestResult = await BarcodeScanner.requestPermissions();
        if (requestResult.camera !== "granted") {
          throw new Error("Camera permission is required for barcode scanning");
        }
      }

      setScannerState((prev) => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      await Toast.show({
        text: errorMessage,
        duration: "long",
        position: "center",
      });
      onError?.(error as Error);
      return false;
    }
  };

  // Enhanced web scanner with better error handling and performance
  const startWebScanner = async (data?: Record<string, unknown>) => {
    try {
      // Check for BarcodeDetector support or use polyfill
      let BarcodeDetectorClass;
      if ("BarcodeDetector" in window) {
        BarcodeDetectorClass = (window as any).BarcodeDetector;
      } else {
        // Import polyfill if available
        try {
          const polyfill = await import("barcode-detector");
          BarcodeDetectorClass = polyfill.BarcodeDetector;
          console.log("Using BarcodeDetector polyfill");
        } catch (polyfillError) {
          console.error("Polyfill import failed:", polyfillError);
          throw new Error(
            "Barcode detection is not supported in this browser. Please try using Chrome or Edge."
          );
        }
      }

      // Enhanced camera constraints with fallback options
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920, min: 1280 }, // Higher resolution for better quality
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 },
          focusMode: "continuous", // Continuous autofocus
          exposureMode: "continuous", // Auto exposure
          whiteBalanceMode: "continuous", // Auto white balance
          // width: { ideal: 1280, min: 640 },
          // height: { ideal: 720, min: 480 },
          // frameRate: { ideal: 30, min: 15 },
        },
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (cameraError) {
        console.error("Camera access failed:", cameraError);
        // Try with basic constraints as fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
        } catch (fallbackError) {
          throw new Error(
            "Camera access denied. Please allow camera permissions and try again."
          );
        }
      }

      streamRef.current = stream;

      // Create video element with enhanced setup
      if (!videoRef.current) {
        const video = document.createElement("video");
        video.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 998;
        `;
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        videoRef.current = video;
        document.body.appendChild(video);
      }

      // Set up video stream
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const video = videoRef.current!;
        video.onloadedmetadata = () => resolve(void 0);
        video.onerror = () => reject(new Error("Video failed to load"));
        setTimeout(() => reject(new Error("Video load timeout")), 10000);
      });

      await videoRef.current.play();

      // Add scanner UI
      updateDOMForOpenCamera();

      // Create canvas for image processing
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        canvasRef.current.style.display = "none";
        document.body.appendChild(canvasRef.current);
      }

      // Create barcode detector with multiple formats
      const formatMap: Record<string, string> = {
        [BarcodeFormat.Code128]: "code_128",
        [BarcodeFormat.QrCode]: "qr_code",
        [BarcodeFormat.Ean13]: "ean_13",
        [BarcodeFormat.Code39]: "code_39",
        [BarcodeFormat.DataMatrix]: "data_matrix",
        [BarcodeFormat.Pdf417]: "pdf417",
      };

      const detectorFormats = formats
        .map((format) => formatMap[format])
        .filter(Boolean);

      let barcodeDetector;
      try {
        barcodeDetector = new BarcodeDetectorClass({
          formats: detectorFormats,
        });
      } catch (detectorError) {
        console.error("BarcodeDetector creation failed:", detectorError);
        // Fallback to QR code only
        barcodeDetector = new BarcodeDetectorClass({
          formats: ["qr_code"],
        });
      }

      // Around line 298, update the setScannerState call:
      setScannerState((prev) => ({
        ...prev,
        isScanning: true,
        isInitialized: true,
        torchEnabled: false, // Reset torch state when starting scanner
        zoomLevel: 1, // Reset zoom level as well
      }));

      // Enhanced detection loop with performance optimization
      const detectBarcodes = async () => {
        if (!videoRef.current || !streamRef.current || !canvasRef.current) {
          console.log("Detection stopped: missing refs");
          return;
        }

        // Check if stream is still active
        if (!streamRef.current.active) {
          console.log("Detection stopped: stream inactive");
          return;
        }

        try {
          // Only process if video is ready
          if (videoRef.current.readyState >= 2) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (
              ctx &&
              videoRef.current.videoWidth > 0 &&
              videoRef.current.videoHeight > 0
            ) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);

              try {
                const barcodes = await barcodeDetector.detect(canvas);

                for (const barcode of barcodes) {
                  await handleBarcodeScanned(barcode.rawValue, {
                    ...data,
                    format: barcode.format,
                    boundingBox: barcode.boundingBox,
                    cornerPoints: barcode.cornerPoints,
                  });
                }
              } catch (detectionError) {
                console.error("Barcode detection error:", detectionError);
                // Continue scanning despite detection errors
              }
            }
          }
        } catch (error) {
          console.error("Detection loop error:", error);
          onError?.(error as Error);
        }

        // Continue detection if stream is active and we're still scanning
        // Use a ref to get current state instead of closure
        if (streamRef.current?.active) {
          detectionLoopRef.current = requestAnimationFrame(detectBarcodes);
        }
      };

      // Start detection loop
      detectionLoopRef.current = requestAnimationFrame(detectBarcodes);

      console.log("Barcode scanner started successfully");
    } catch (error) {
      console.error("Web scanner error:", error);
      onError?.(error as Error);
      await Toast.show({
        text: (error as Error).message,
        duration: "long",
        position: "top",
      });
      await stopWebScanner();
    }
  };

  const stopWebScanner = async () => {
    // Reset scanner state including torch state
    setScannerState((prev) => ({
      ...prev,
      isScanning: false,
      torchEnabled: false, // Reset torch state
      zoomLevel: 1, // Reset zoom level as well
    }));

    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }

    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }

    updateDOMForCloseCamera();
  };

  // Enhanced barcode handling with improved toast visibility
  const handleBarcodeScanned = async (
    rawValue: string,
    data?: Record<string, unknown>
  ) => {
    const currentTime = Date.now();

    // Enhanced duplicate detection
    if (
      rawValue === lastScannedCode.current &&
      currentTime - lastScannedTime.current < scanThreshold
    ) {
      return;
    }

    // Validate barcode value
    if (!rawValue || rawValue.trim().length === 0) {
      return;
    }

    // Update tracking variables
    lastScannedCode.current = rawValue;
    lastScannedTime.current = currentTime;
    scanCount.current++;

    // Provide haptic feedback if available
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available, continue silently
    }

    showCustomToast(rawValue, toastTimeout);
    delay && await sleep(delay);

    // Proceed with barcode processing after delay
    onBarcodeScanned(rawValue, data);
  };

  // Enhanced toast notification with custom overlay for maximum visibility
  const showCustomToast = async (rawValue: string, duration: number) => {
    return new Promise((resolve) => {
      // Add custom overlay for enhanced visibility (PWA compatible)
      const toastOverlay = document.createElement("div");
      toastOverlay.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(40, 167, 69, 0.95);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          z-index: 99999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: slideInFromTop 0.3s ease-out;
          max-width: 90vw;
          text-align: center;
        ">✅ Đã quét: ${rawValue}</div>
      `;

      document.body.appendChild(toastOverlay);

      // Auto remove after 3 seconds
      setTimeout(() => {
        if (toastOverlay.parentNode) {
          toastOverlay.parentNode.removeChild(toastOverlay);
          resolve(null);
        }
      }, duration);
    });
  };

  // Enhanced torch control with better feedback
  const toggleTorch = async () => {
    if (!enableTorch) return;

    try {
      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb && streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities();

        if ("torch" in capabilities) {
          const newTorchState = !scannerState.torchEnabled;
          await track.applyConstraints({
            advanced: [{ torch: newTorchState } as any],
          });
          setScannerState((prev) => ({ ...prev, torchEnabled: newTorchState }));

          // Update button visual state
          const torchButton = document.querySelector(
            ".scanner-torch-button ion-fab-button"
          );
          if (torchButton) {
            torchButton.setAttribute(
              "color",
              newTorchState ? "warning" : "light"
            );
          }

          // Show feedback toast
          await Toast.show({
            text: newTorchState ? "Flash ON" : "Flash OFF",
            duration: "short",
            position: "bottom",
          });
        } else {
          await Toast.show({
            text: "Flash not supported on this device",
            duration: "short",
            position: "bottom",
          });
        }
      } else {
        // Native torch control would go here
        await Toast.show({
          text: "Flash control not available in native mode",
          duration: "short",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Torch control error:", error);
      await Toast.show({
        text: "Failed to toggle flash",
        duration: "short",
        position: "bottom",
      });
    }
  };

  // Enhanced zoom control with multiple levels and better feedback
  const toggleZoom = async () => {
    if (!enableZoom) return;

    try {
      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb && streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities();

        if ("zoom" in capabilities) {
          // Cycle through zoom levels: 1x -> 1.5x -> 2x -> 1x
          let newZoomLevel;
          if (scannerState.zoomLevel === 1) {
            newZoomLevel = 1.5;
          } else if (scannerState.zoomLevel === 1.5) {
            newZoomLevel = 2;
          } else {
            newZoomLevel = 1;
          }

          await track.applyConstraints({
            advanced: [{ zoom: newZoomLevel } as any],
          });
          setScannerState((prev) => ({ ...prev, zoomLevel: newZoomLevel }));

          // Update button visual state
          const zoomButton = document.querySelector(
            ".scanner-zoom-button ion-fab-button"
          );
          if (zoomButton) {
            const color = newZoomLevel > 1 ? "secondary" : "light";
            zoomButton.setAttribute("color", color);
          }

          // Show feedback toast
          await Toast.show({
            text: `Zoom: ${newZoomLevel}x`,
            duration: "short",
            position: "bottom",
          });
        } else {
          await Toast.show({
            text: "Zoom not supported on this device",
            duration: "short",
            position: "bottom",
          });
        }
      } else {
        await Toast.show({
          text: "Zoom control not available in native mode",
          duration: "short",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Zoom control error:", error);
      await Toast.show({
        text: "Failed to adjust zoom",
        duration: "short",
        position: "bottom",
      });
    }
  };

  // Enhanced start scan function
  const startScan = async (data?: Record<string, unknown>) => {
    try {
      // Reset tracking variables
      lastScannedCode.current = "";
      lastScannedTime.current = 0;
      scanCount.current = 0;

      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb) {
        await startWebScanner(data);
      } else {
        if (!(await checkPermissions())) {
          return;
        }

        // Enhanced native implementation
        updateDOMForOpenCamera();
        setScannerState((prev) => ({ ...prev, isScanning: true }));

        await BarcodeScanner.startScan({
          formats: formats,
        });

        // Add listener for scanned barcodes
        listenerRef.current = await BarcodeScanner.addListener(
          "barcodesScanned",
          (result) => {
            const barcodes = result.barcodes;
            if (barcodes && barcodes.length > 0) {
              handleBarcodeScanned(barcodes[0].rawValue, {
                ...data,
                format: barcodes[0].format,
                cornerPoints: barcodes[0].cornerPoints,
              });
            }
          }
        );
      }
    } catch (error) {
      console.error("Error starting scan:", error);
      setScannerState((prev) => ({ ...prev, isScanning: false }));
      onError?.(error as Error);

      if (!onError) {
        await Toast.show({
          text: (error as Error).message,
          duration: "long",
          position: "top",
        });
      }
    }
  };

  // Enhanced stop scan function
  const stopScan = async () => {
    try {
      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb) {
        await stopWebScanner();
      } else {
        setScannerState((prev) => ({ ...prev, isScanning: false }));
        updateDOMForCloseCamera();

        if (listenerRef.current) {
          await listenerRef.current.remove();
          listenerRef.current = null;
        }

        await BarcodeScanner.stopScan();
      }
    } catch (error) {
      console.error("Error stopping scan:", error);
      onError?.(error as Error);
    } finally {
      onStop?.()
    }
  };

  // Clean up on unmount
  // useEffect(() => {
  //   return () => {
  //     stopScan();
  //   };
  // }, []);

  return {
    startScan,
    stopScan,
    toggleTorch,
    toggleZoom,
    scannerState,
    videoRef,
  };
};
