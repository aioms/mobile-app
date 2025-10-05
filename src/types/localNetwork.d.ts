export interface PrinterDevice {
  ip: string;
  port: number;
  name?: string;
  status: 'online' | 'offline' | 'unknown';
  model?: string;
}

export interface LocalNetworkPermissionStatus {
  granted: boolean;
  supported: boolean;
  error?: string;
}

export interface PrinterDiscoveryOptions {
  networkRange?: string;
  timeout?: number;
  ports?: number[];
}

export interface PrinterConnectionResult {
  success: boolean;
  printer?: PrinterDevice;
  error?: string;
}

export interface LocalNetworkServiceInterface {
  isLocalNetworkAccessSupported(): boolean;
  requestLocalNetworkPermission(): Promise<boolean>;
  discoverPrinters(networkRange?: string): Promise<PrinterDevice[]>;
  connectToPrinter(printer: PrinterDevice): Promise<boolean>;
  getDiscoveredPrinters(): PrinterDevice[];
  hasLocalNetworkPermission(): boolean;
}