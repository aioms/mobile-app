import {
  PrinterConfig,
  PrinterStatus,
  PrinterResponse,
  DEFAULT_XPRINTER_CONFIG,
  BarcodeLayout,
  PrinterV2PrintData,
  PrinterV2Response,
  PrinterV2TestData,
} from '@/types/printer.d';

// Proxy server configuration
const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'https://desktop-0au7em7.tail0c14cf.ts.net';

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
      console.log({ url: this.baseUrl, productData, quantity  });
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
      console.log({ response });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to print horizontal barcode: ${(error as Error).message}`,
      };
    }
  }

  // =========================================================================
  // Printer Service V2 — talks to /api/printer/v2/* endpoints.
  //
  // Differences vs. the legacy methods above:
  //   - Transport & mode are controlled by the proxy-server .env (ESC/POS,
  //     TSPL or ZPL; TCP or USB). The client only chooses the *layout*.
  //   - Supports `layout: 'side-by-side'` for two-up 76×22 mm printing.
  //   - Server performs a fresh connection check before every print and can
  //     automatically fall back from primary (LAN) to a configured USB path.
  //   - Response surfaces the `via` / `transport` fields so the UI can tell
  //     the user whether the job went out over LAN or USB.
  // =========================================================================

  /**
   * Probe the V2 service — primary first, then fallback if configured.
   */
  async testConnectionV2(): Promise<PrinterV2Response<PrinterV2TestData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/v2/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return (await response.json()) as PrinterV2Response<PrinterV2TestData>;
    } catch (error) {
      return {
        success: false,
        message: `Failed to test V2 connection: ${(error as Error).message}`,
        data: null,
      };
    }
  }

  /**
   * Fetch the V2 service description (primary / fallback targets, mode, etc.)
   * Useful for debug UIs.
   */
  async describeV2(): Promise<PrinterV2Response> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/v2/describe`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return (await response.json()) as PrinterV2Response;
    } catch (error) {
      return {
        success: false,
        message: `Failed to describe V2: ${(error as Error).message}`,
        data: null,
      };
    }
  }

  /**
   * Print barcode labels via the V2 pipeline.
   *
   * @param productData     productCode (required) + optional productName
   * @param quantity        total labels to print (1–500)
   * @param options.layout  'single' (one per strip) or 'side-by-side'
   *                        (two 35 mm labels on a 76 mm strip)
   */
  async printBarcodeLabelsV2(
    productData: { productCode: string; productName?: string },
    quantity: number = 1,
    options: { layout?: BarcodeLayout } = {},
  ): Promise<PrinterV2Response<PrinterV2PrintData>> {
    const { layout = 'single' } = options;
    try {
      const response = await fetch(`${this.baseUrl}/api/printer/v2/print-barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productData, quantity, layout }),
      });
      return (await response.json()) as PrinterV2Response<PrinterV2PrintData>;
    } catch (error) {
      return {
        success: false,
        message: `Failed to print (V2): ${(error as Error).message}`,
        data: null,
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