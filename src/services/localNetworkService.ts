import { Toast } from '@capacitor/toast';

export interface PrinterDevice {
  ip: string;
  port: number;
  name?: string;
  status: 'online' | 'offline' | 'unknown';
  model?: string;
}

export class LocalNetworkService {
  private static instance: LocalNetworkService;
  private hasPermission: boolean = false;
  private discoveredPrinters: PrinterDevice[] = [];

  private constructor() {}

  public static getInstance(): LocalNetworkService {
    if (!LocalNetworkService.instance) {
      LocalNetworkService.instance = new LocalNetworkService();
    }
    return LocalNetworkService.instance;
  }

  /**
   * Kiểm tra xem browser có hỗ trợ Local Network Access không
   */
  public isLocalNetworkAccessSupported(): boolean {
    // Kiểm tra xem có đang chạy trong secure context không (HTTPS hoặc localhost)
    const isSecureContext = window.isSecureContext;
    
    // Kiểm tra xem browser có hỗ trợ Private Network Access không
    const hasPrivateNetworkAccess = 'fetch' in window;
    
    return isSecureContext && hasPrivateNetworkAccess;
  }

  /**
   * Xin quyền truy cập local network từ user
   */
  public async requestLocalNetworkPermission(): Promise<boolean> {
    try {
      if (!this.isLocalNetworkAccessSupported()) {
        await Toast.show({
          text: 'Trình duyệt không hỗ trợ truy cập mạng local. Vui lòng sử dụng Chrome/Edge phiên bản mới nhất.',
          duration: 'long',
          position: 'top',
        });
        return false;
      }

      // Thực hiện một request test để trigger permission prompt
      const testResponse = await this.testLocalNetworkConnection();
      
      if (testResponse) {
        this.hasPermission = true;
        await Toast.show({
          text: 'Đã được cấp quyền truy cập mạng local',
          duration: 'short',
          position: 'top',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting local network permission:', error);
      
      // Nếu lỗi là do CORS hoặc network, có thể user đã từ chối permission
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        await Toast.show({
          text: 'Quyền truy cập mạng local bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.',
          duration: 'long',
          position: 'top',
        });
      } else {
        await Toast.show({
          text: `Lỗi khi xin quyền truy cập mạng local: ${(error as Error).message}`,
          duration: 'long',
          position: 'top',
        });
      }
      
      return false;
    }
  }

  /**
   * Test kết nối local network để trigger permission prompt
   */
  private async testLocalNetworkConnection(): Promise<boolean> {
    try {
      // Thử kết nối đến một IP local phổ biến để trigger permission
      const testIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
      
      for (const ip of testIPs) {
        try {
          const response = await fetch(`http://${ip}`, {
            method: 'HEAD',
            mode: 'no-cors',
            // @ts-ignore - targetAddressSpace là experimental feature
            targetAddressSpace: 'local',
            signal: AbortSignal.timeout(2000), // 2 second timeout
          });
          
          // Nếu không có lỗi, có nghĩa là permission đã được cấp
          return true;
        } catch (error) {
          // Tiếp tục với IP tiếp theo
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Test local network connection failed:', error);
      return false;
    }
  }

  /**
   * Tìm kiếm máy in trên mạng local
   */
  public async discoverPrinters(networkRange: string = '192.168.0'): Promise<PrinterDevice[]> {
    if (!this.hasPermission) {
      const permissionGranted = await this.requestLocalNetworkPermission();
      if (!permissionGranted) {
        return [];
      }
    }

    this.discoveredPrinters = [];
    const promises: Promise<void>[] = [];

    // Scan từ .1 đến .254
    for (let i = 1; i <= 254; i++) {
      const ip = `${networkRange}.${i}`;
      promises.push(this.checkPrinterAtIP(ip));
    }

    // Chờ tất cả các request hoàn thành
    await Promise.allSettled(promises);

    return this.discoveredPrinters;
  }

  /**
   * Kiểm tra xem có máy in tại IP cụ thể không
   */
  private async checkPrinterAtIP(ip: string): Promise<void> {
    const commonPrinterPorts = [9100, 515, 631, 80, 443];

    for (const port of commonPrinterPorts) {
      try {
        const response = await fetch(`http://${ip}:${port}`, {
          method: 'HEAD',
          mode: 'no-cors',
          // @ts-ignore - targetAddressSpace là experimental feature
          targetAddressSpace: 'local',
          signal: AbortSignal.timeout(1000), // 1 second timeout
        });

        // Nếu kết nối thành công, thêm vào danh sách
        const printer: PrinterDevice = {
          ip,
          port,
          status: 'online',
          name: `Printer at ${ip}:${port}`,
        };

        // Thử lấy thêm thông tin về máy in
        await this.getPrinterInfo(printer);
        
        this.discoveredPrinters.push(printer);
        break; // Tìm thấy máy in tại IP này, không cần check port khác
      } catch (error) {
        // Tiếp tục với port tiếp theo
        continue;
      }
    }
  }

  /**
   * Lấy thông tin chi tiết về máy in
   */
  private async getPrinterInfo(printer: PrinterDevice): Promise<void> {
    try {
      // Thử kết nối TCP để lấy status
      const response = await fetch(`http://${printer.ip}:${printer.port}`, {
        method: 'POST',
        mode: 'no-cors',
        // @ts-ignore
        targetAddressSpace: 'local',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array([0x10, 0x04, 0x01]), // DLE EOT n command để lấy status
        signal: AbortSignal.timeout(2000),
      });

      // Nếu có response, máy in đang online
      printer.status = 'online';
      
      // Có thể thêm logic để parse response và lấy model name
      if (printer.ip.includes('192.168.0.220')) {
        printer.model = 'Xprinter 365B';
        printer.name = 'Xprinter 365B';
      }
    } catch (error) {
      printer.status = 'unknown';
    }
  }

  /**
   * Kết nối đến máy in cụ thể
   */
  public async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    try {
      const response = await fetch(`http://${printer.ip}:${printer.port}`, {
        method: 'POST',
        mode: 'no-cors',
        // @ts-ignore
        targetAddressSpace: 'local',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array([0x1B, 0x40]), // ESC @ - Initialize printer
        signal: AbortSignal.timeout(3000),
      });

      await Toast.show({
        text: `Đã kết nối thành công đến máy in ${printer.name || printer.ip}`,
        duration: 'short',
        position: 'top',
      });

      return true;
    } catch (error) {
      await Toast.show({
        text: `Không thể kết nối đến máy in ${printer.name || printer.ip}: ${(error as Error).message}`,
        duration: 'long',
        position: 'top',
      });
      return false;
    }
  }

  /**
   * Lấy danh sách máy in đã tìm thấy
   */
  public getDiscoveredPrinters(): PrinterDevice[] {
    return this.discoveredPrinters;
  }

  /**
   * Kiểm tra xem đã có quyền local network chưa
   */
  public hasLocalNetworkPermission(): boolean {
    return this.hasPermission;
  }
}

export default LocalNetworkService.getInstance();