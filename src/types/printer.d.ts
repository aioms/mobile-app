export interface PrinterConfig {
  ipAddress: string;
  port: number;
  timeout: number;
}

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