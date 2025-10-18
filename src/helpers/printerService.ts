import { PrinterConfig, PrinterStatus, PrinterResponse, DEFAULT_XPRINTER_CONFIG } from '@/types/printer.d';

// Proxy server configuration
const PROXY_SERVER_URL = 'http://localhost:3001';

export class XprinterService {
  private config: PrinterConfig;
  private baseUrl: string;

  constructor(config: PrinterConfig = DEFAULT_XPRINTER_CONFIG) {
    this.config = { ...DEFAULT_XPRINTER_CONFIG, ...config };
    this.baseUrl = PROXY_SERVER_URL;
  }

  /**
   * Initialize printer connection via proxy server
   */
  async initialize(): Promise<PrinterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize printer: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<PrinterStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      return {
        isConnected: result.success,
        isOnline: result.data?.isConnected,
        hasError: !result.success,
        errorMessage: result.success ? undefined : result.message,
        printerModel: 'XP 365B',
        ipAddress: this.config.ipAddress,
        port: this.config.port,
      };
    } catch (error) {
      return {
        isConnected: false,
        isOnline: false,
        hasError: true,
        errorMessage: (error as Error).message,
        printerModel: 'XP 365B',
        ipAddress: this.config.ipAddress,
        port: this.config.port,
      };
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrinterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to get printer status: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Print barcode labels (35mm x 22mm)
   */
  async printBarcodeLabel(
    productData: { productCode: string; productName?: string },
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/print-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          quantity,
          printerConfig: this.config,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to print barcode: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Print horizontal barcode labels
   */
  async printHorizontalBarcodes(
    productData: { productCode: string; productName?: string },
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/print-horizontal-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          quantity,
          printerConfig: this.config,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to print horizontal barcode: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Update printer configuration
   */
  async updateConfig(newConfig: Partial<PrinterConfig>): Promise<PrinterResponse> {
    try {
      this.config = { ...this.config, ...newConfig };

      const response = await fetch(`${this.baseUrl}/api/printer/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to update printer config: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Disconnect printer
   */
  async disconnect(): Promise<PrinterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to disconnect printer: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PrinterConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create XprinterService instance
 */
export function createXprinterService(config?: PrinterConfig): XprinterService {
  return new XprinterService(config);
}

// Export default configuration
export { DEFAULT_XPRINTER_CONFIG };