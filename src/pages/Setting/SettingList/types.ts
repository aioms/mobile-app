export type BarcodeLayoutOption = "auto-pair" | "single";

export interface PrinterSettings {
  /** IP address of the LAN printer (proxy server target). */
  ipAddress: string;
  port: number;
  timeout: number;
  barcodeLayout: BarcodeLayoutOption;
  /** Paper width in millimetres (76 mm stock for barcode strips). */
  paperWidth: number;
  /** Paper height in millimetres (22 mm per strip). */
  paperHeight: number;
}

export interface ScannerSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export interface DeviceSettings {
  printer: PrinterSettings;
  scanner: ScannerSettings;
  updatedAt: string;
}

export type PrinterConnectionState = "idle" | "testing" | "connected" | "error";
