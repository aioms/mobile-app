export interface PrinterConfig {
  ipAddress: string;
  port: number;
  timeout: number;
}

export const DEFAULT_XPRINTER_CONFIG: PrinterConfig = {
  ipAddress: "192.168.1.220",
  port: 9100,
  timeout: 5000
};

export interface PrintJob {
  productName: string;
  productCode: string;
  quantity: number;
}

export interface PrinterStatus {
  isConnected: boolean;
  isOnline?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  printerModel?: string;
  ipAddress?: string;
  port?: number;
}

export interface ESCPOSCommand {
  command: Uint8Array;
  description: string;
}

export interface LabelDimensions {
  width: number; // in mm (print area)
  height: number; // in mm (print area)
  dpi: number; // dots per inch
}

export interface PaperDimensions {
  width: number; // in mm (paper width)
  height: number; // in mm (paper height)
}

export interface PrinterResponse {
  success: boolean;
  message: string;
  data?: any;
}

// --- Printer Service V2 -----------------------------------------------------

export type BarcodeLayout = 'single' | 'side-by-side';

export type PrinterTransport = 'tcp' | 'usb-spooler' | 'usb-libusb';

export type PrinterMode = 'escpos' | 'tspl' | 'zpl';

export interface PrinterV2TestData {
  isConnected: boolean;
  target: string;
  using?: 'primary' | 'fallback';
  primary?: string;
  fallback?: string | null;
  error?: string;
}

export interface PrinterV2PrintData {
  productCode: string;
  productName: string;
  quantity: number;
  layout: BarcodeLayout;
  mode: PrinterMode;
  transport: PrinterTransport;
  via: 'primary' | 'fallback';
  target: string;
  bytesSent: number;
  timestamp: string;
}

export interface PrinterV2Response<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}