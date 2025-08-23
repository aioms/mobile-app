import { useEffect, useRef } from "react";
import {
  BarcodeScanner,
  BarcodeFormat,
} from "@capacitor-mlkit/barcode-scanning";
import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";

interface UseBarcodeScanner {
  onBarcodeScanned: (value: string, data?: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export const useBarcodeScanner = ({
  onBarcodeScanned,
  onError,
}: UseBarcodeScanner) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listenerRef = useRef<any>(null);
  const lastScannedCode = useRef<string>("");
  const lastScannedTime = useRef<number>(0);
  const scanCount = useRef<number>(0);
  const SCAN_THRESHOLD = 1000; // 1 seconds threshold between scans

  const updateDOMForOpenCamera = () => {
    // Create stop button container if it doesn't exist
    const stopButtonContainer = document.createElement("div");
    stopButtonContainer.innerHTML = `
      <ion-fab vertical="bottom" horizontal="center" slot="fixed" class="scanner-stop-button">
        <ion-fab-button color="danger" onclick="window.stopScanner()">
          Stop
        </ion-fab-button>
      </ion-fab>
    `;
    document.body.appendChild(stopButtonContainer);

    // Add global function to stop scanner
    (window as any).stopScanner = () => {
      stopScan();
    };

    // Hide all UI elements and make background transparent
    document.querySelector("body")?.classList.add("scanner-active");
    document.querySelector("ion-content")?.classList.add("scanner-active");
    document.querySelector("ion-app")?.classList.add("scanner-active");

    // Apply additional styles for fullscreen
    const elements = document.querySelectorAll(
      "ion-header, ion-footer, ion-toolbar, ion-content > *:not(.barcode-scanner):not(.scanner-stop-button)"
    );
    elements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  };

  const updateDOMForCloseCamera = () => {
    // Remove stop button
    const stopButtons = document.querySelectorAll(".scanner-stop-button");
    stopButtons.forEach((button) => button.remove());

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
  };

  const checkPermissions = async () => {
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) {
      await Toast.show({
        text: "Camera không được hỗ trợ",
        duration: "short",
        position: "center",
      });
      return false;
    }

    const permissionStatus = await BarcodeScanner.checkPermissions();

    if (permissionStatus.camera === "denied") {
      const requestResult = await BarcodeScanner.requestPermissions();
      if (requestResult.camera !== "granted") {
        await Toast.show({
          text: "Bạn cần cấp quyền truy cập camera để quét mã vạch",
          duration: "short",
          position: "center",
        });
        return false;
      }
    }

    return true;
  };

  const startWebScanner = async () => {
    try {
      // Check if BarcodeDetector is supported
      if (!("BarcodeDetector" in window)) {
        throw new Error("Trình duyệt không hỗ trợ quét mã vạch");
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      // Create video element if it doesn't exist
      if (!videoRef.current) {
        const video = document.createElement("video");
        video.style.position = "fixed";
        video.style.top = "0";
        video.style.left = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.zIndex = "998";
        videoRef.current = video;
        document.body.appendChild(video);
      }

      // Set up video stream
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Add scanner UI
      updateDOMForOpenCamera();

      // Create barcode detector
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ["code_128"],
      });

      // Start detection loop
      const detectBarcodes = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);

          for (const barcode of barcodes) {
            await handleBarcodeScanned(barcode.rawValue);
          }
        } catch (error) {
          console.error("Barcode detection error:", error);
          onError?.(error as Error);
        }

        // Continue detection if stream is active
        if (streamRef.current.active) {
          requestAnimationFrame(detectBarcodes);
        }
      };

      requestAnimationFrame(detectBarcodes);
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }

    updateDOMForCloseCamera();
  };

  const handleBarcodeScanned = async (rawValue: string, data?: Record<string, unknown>) => {
    const currentTime = Date.now();

    // Check for duplicate scans
    if (
      rawValue === lastScannedCode.current &&
      currentTime - lastScannedTime.current < SCAN_THRESHOLD
    ) {
      return;
    }

    // Update last scanned info
    lastScannedCode.current = rawValue;
    lastScannedTime.current = currentTime;
    scanCount.current++;

    onBarcodeScanned(rawValue, data);

    await Toast.show({
      text: `Đã quét mã: ${rawValue}`,
      duration: "short",
      position: "center",
    });
  };

  const startScan = async (data?: Record<string, unknown>) => {
    try {
      // Reset scan tracking variables
      lastScannedCode.current = "";
      lastScannedTime.current = 0;
      scanCount.current = 0;

      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb) {
        await startWebScanner();
      } else {
        if (!(await checkPermissions())) {
          return;
        }

        // Native implementation
        updateDOMForOpenCamera();

        await BarcodeScanner.startScan({
          formats: [BarcodeFormat.Code128],
        });

        // Add listener for scanned barcodes
        listenerRef.current = await BarcodeScanner.addListener(
          "barcodesScanned",
          result => {
            const barcodes = result.barcodes;
            handleBarcodeScanned(barcodes[0].rawValue, data);
          }
        );
      }
    } catch (error) {
      console.error("Error starting scan:", error);
      onError?.(error as Error);

      !onError && await Toast.show({
        text: (error as Error).message,
        duration: "long",
        position: "top",
      });
    }
  };

  const stopScan = async () => {
    try {
      const isWeb = Capacitor.getPlatform() === "web";

      if (isWeb) {
        await stopWebScanner();
      } else {
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
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  return {
    startScan,
    stopScan,
    videoRef,
  };
};
