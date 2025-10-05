import { PrinterConfig, PrintJob, PrinterStatus, ESCPOSCommand, LabelDimensions, PaperDimensions, PrinterResponse } from '@/types/printer';

/**
 * Xprinter 365B Network Printer Service
 * Handles ESC/POS command generation and network communication for Code128 barcodes
 * Optimized for 35x22mm print area on 76x25mm paper labels
 */
export class XprinterService {
  private config: PrinterConfig;
  private labelDimensions: LabelDimensions = {
    width: 35, // mm (print area)
    height: 22, // mm (print area) - optimized for dual barcode layout
    dpi: 203 // Xprinter 365B DPI
  };

  private paperDimensions: PaperDimensions = {
    width: 76, // mm (paper width)
    height: 25, // mm (paper height) - supports dual barcode layout
  };

  // Dual barcode layout dimensions
  private dualBarcodeLayout = {
    barcodeWidth: 17, // mm per barcode (35mm / 2 with margin)
    barcodeHeight: 6, // mm compact height
    textHeight: 3, // mm for product name
    codeHeight: 2, // mm for product code
    horizontalSpacing: 1, // mm between barcodes
    verticalSpacing: 1 // mm between elements
  };

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  /**
   * ESC/POS Commands for Xprinter 365B
   */
  private getESCPOSCommands() {
    return {
      // Basic commands
      ESC: 0x1B,
      GS: 0x1D,
      LF: 0x0A,
      CR: 0x0D,
      
      // Initialize printer
      INIT: new Uint8Array([0x1B, 0x40]),
      
      // Text formatting
      BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
      BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
      
      // Alignment
      ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
      ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
      ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),
      
      // Font size
      FONT_SIZE_NORMAL: new Uint8Array([0x1D, 0x21, 0x00]),
      FONT_SIZE_SMALL: new Uint8Array([0x1D, 0x21, 0x01]),
      FONT_SIZE_TINY: new Uint8Array([0x1D, 0x21, 0x11]),
      
      // Line spacing
      LINE_SPACING_DEFAULT: new Uint8Array([0x1B, 0x32]),
      LINE_SPACING_TIGHT: new Uint8Array([0x1B, 0x33, 0x10]),
      
      // Paper handling
      PAPER_FEED: new Uint8Array([0x1B, 0x64, 0x02]),
      PAPER_CUT: new Uint8Array([0x1D, 0x56, 0x00]),
      
      // Barcode settings
      BARCODE_HEIGHT: new Uint8Array([0x1D, 0x68, 0x50]), // 80 dots height
      BARCODE_WIDTH: new Uint8Array([0x1D, 0x77, 0x02]), // Width multiplier
      BARCODE_HRI_BELOW: new Uint8Array([0x1D, 0x48, 0x02]), // Print HRI below barcode
      BARCODE_FONT_SMALL: new Uint8Array([0x1D, 0x66, 0x01]),
    };
  }

  /**
   * Generate Code128 barcode command optimized for 35x22mm print area with 76x25mm paper
   * Ensures optimal readability and scanning performance within the specified dimensions
   */
  private generateBarcodeCommand(data: string): Uint8Array {
    const barcodeData = new TextEncoder().encode(data);
    
    // Code128 barcode command: GS k m d1...dk NUL
    const barcodeCommand = new Uint8Array([
      0x1D, 0x6B, 0x49, // GS k {CODE128}
      barcodeData.length, // Length
      ...barcodeData // Data
    ]);

    // Optimized settings for 35x22mm print area:
    // - Height: 80 dots (~10mm at 203 DPI) for good readability
    // - Width: 2x multiplier for better scanning reliability
    // - HRI below barcode for human verification
    // - Small font for HRI to save vertical space
    return this.combineCommands([
      new Uint8Array([0x1D, 0x68, 0x50]), // 80 dots height (~10mm for optimal readability)
      new Uint8Array([0x1D, 0x77, 0x02]), // Width multiplier 2 for better scanning
      new Uint8Array([0x1D, 0x48, 0x02]), // HRI below barcode
      new Uint8Array([0x1D, 0x66, 0x01]), // Font B (small) for HRI text to save space
      barcodeCommand
    ]);
  }

  /**
   * Generate dual barcode label command for horizontal printing (2 barcodes per line)
   * Uses optimized layout within 35x22mm print area
   */
  public generateDualBarcodeCommand(printJob1: PrintJob, printJob2?: PrintJob): Uint8Array {
    const commands = this.getESCPOSCommands();
    const commandList: Uint8Array[] = [];

    // Initialize printer
    commandList.push(commands.INIT);
    
    // Set line spacing for compact layout
    commandList.push(commands.LINE_SPACING_TIGHT);
    
    // Set left margin to 0
    commandList.push(new Uint8Array([0x1D, 0x4C, 0x00, 0x00]));

    // Calculate positions for dual layout (203 DPI)
    const leftPosition = 0;
    const rightPosition = Math.floor((this.dualBarcodeLayout.barcodeWidth + this.dualBarcodeLayout.horizontalSpacing) * 203 / 25.4); // Convert mm to dots

    // First barcode (left side)
    commandList.push(commands.ALIGN_LEFT);
    commandList.push(new Uint8Array([0x1B, 0x24, leftPosition, 0x00])); // Set absolute position
    
    // Product name for first barcode (truncated for space)
    if (printJob1.productName) {
      commandList.push(commands.BOLD_ON);
      commandList.push(commands.FONT_SIZE_TINY);
      const truncatedName = printJob1.productName.length > 12 ? 
        printJob1.productName.substring(0, 12) + '...' : printJob1.productName;
      commandList.push(this.generateTextCommand(truncatedName, { newLine: true }));
      commandList.push(commands.BOLD_OFF);
    }

    // First barcode - optimized for dual layout
    if (printJob1.productCode) {
      commandList.push(this.generateCompactBarcodeCommand(printJob1.productCode));
      commandList.push(commands.FONT_SIZE_TINY);
      commandList.push(this.generateTextCommand(printJob1.productCode, { newLine: false }));
    }

    // If second barcode exists, add it to the right side
    if (printJob2) {
      // Move cursor up to align with first barcode
      commandList.push(new Uint8Array([0x1B, 0x4A, 0x00])); // Line feed 0 (move to same line)
      
      // Set position for second barcode
      commandList.push(new Uint8Array([0x1B, 0x24, rightPosition & 0xFF, (rightPosition >> 8) & 0xFF]));
      
      // Product name for second barcode
      if (printJob2.productName) {
        commandList.push(commands.BOLD_ON);
        commandList.push(commands.FONT_SIZE_TINY);
        const truncatedName = printJob2.productName.length > 12 ? 
          printJob2.productName.substring(0, 12) + '...' : printJob2.productName;
        commandList.push(this.generateTextCommand(truncatedName, { newLine: true }));
        commandList.push(commands.BOLD_OFF);
      }

      // Second barcode
      if (printJob2.productCode) {
        commandList.push(this.generateCompactBarcodeCommand(printJob2.productCode));
        commandList.push(commands.FONT_SIZE_TINY);
        commandList.push(this.generateTextCommand(printJob2.productCode, { newLine: false }));
      }
    }

    // Final formatting and cut
    commandList.push(new Uint8Array([commands.LF, commands.LF]));
    commandList.push(new Uint8Array([0x1D, 0x56, 0x01])); // Partial cut

    return this.combineCommands(commandList);
  }

  /**
   * Generate compact barcode command for dual layout
   * Optimized for 17mm width per barcode
   */
  private generateCompactBarcodeCommand(data: string): Uint8Array {
    const barcodeData = new TextEncoder().encode(data);
    
    // Calculate optimal barcode height in dots (203 DPI)
    const heightInDots = Math.floor(this.dualBarcodeLayout.barcodeHeight * 203 / 25.4); // ~48 dots for 6mm
    
    // Code128 barcode command with compact settings
    const barcodeCommand = new Uint8Array([
      0x1D, 0x6B, 0x49, // GS k {CODE128}
      barcodeData.length, // Length
      ...barcodeData // Data
    ]);

    // Compact settings optimized for dual layout:
    // - Height: calculated from layout dimensions
    // - Width: 1x multiplier for space efficiency
    // - HRI below barcode with tiny font
    return this.combineCommands([
      new Uint8Array([0x1D, 0x68, heightInDots]), // Dynamic height based on layout
      new Uint8Array([0x1D, 0x77, 0x01]), // Width multiplier 1 (narrow for dual layout)
      new Uint8Array([0x1D, 0x48, 0x02]), // HRI below barcode
      new Uint8Array([0x1D, 0x66, 0x01]), // Font B (small) for HRI
      barcodeCommand
    ]);
  }

  /**
   * Generate optimized label command for Xprinter 365B (35x22mm) with Code128 barcode
   */
  public generateXprinter365BLabelCommand(printJob: PrintJob): Uint8Array {
    const commands = this.getESCPOSCommands();
    const commandList: Uint8Array[] = [];

    // Initialize printer
    commandList.push(commands.INIT);
    
    // Set standard mode (not label mode)
    // commandList.push(new Uint8Array([0x1B, 0x4D, 0x01])); // Remove label mode
    
    // Set line spacing for compact layout
    commandList.push(commands.LINE_SPACING_TIGHT);
    
    // Set left margin to 0
    commandList.push(new Uint8Array([0x1D, 0x4C, 0x00, 0x00]));

    // Product name (top line, bold, center aligned)
    if (printJob.productName) {
      commandList.push(commands.ALIGN_CENTER);
      commandList.push(commands.BOLD_ON);
      commandList.push(commands.FONT_SIZE_NORMAL);
      
      const productLines = this.splitTextToLines(printJob.productName, 20);
      productLines.forEach((line, index) => {
        commandList.push(this.generateTextCommand(line, { newLine: index < productLines.length - 1 }));
      });
      
      commandList.push(commands.BOLD_OFF);
      commandList.push(new Uint8Array([commands.LF])); // Extra line break
    }

    // Code128 barcode (center aligned) - Optimized for 35x22mm print area
    if (printJob.productCode) {
      commandList.push(commands.ALIGN_CENTER);
      
      // Use the optimized barcode generation method
      commandList.push(this.generateBarcodeCommand(printJob.productCode));
      
      commandList.push(new Uint8Array([commands.LF, commands.LF])); // Two line breaks after barcode
    }

    // Product code (bottom line, small font, center aligned)
    if (printJob.productCode) {
      commandList.push(commands.ALIGN_CENTER);
      commandList.push(commands.FONT_SIZE_SMALL);
      commandList.push(this.generateTextCommand(printJob.productCode, { newLine: true }));
    }

    // Feed paper (3 lines)
    commandList.push(new Uint8Array([commands.LF, commands.LF, commands.LF]));
    
    // Cut paper (partial cut for label printers)
    commandList.push(new Uint8Array([0x1D, 0x56, 0x01])); // Partial cut instead of full cut

    return this.combineCommands(commandList);
  }

  /**
   * Print dual barcode labels (2 barcodes per line)
   */
  async printDualBarcodeLabel(
    printJob1: PrintJob,
    printJob2?: PrintJob,
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      // Validate first print job
      if (!printJob1.productCode || printJob1.productCode.trim() === '') {
        return {
          success: false,
          message: 'Mã vạch đầu tiên không được để trống'
        };
      }

      // Validate second print job if provided
      if (printJob2 && (!printJob2.productCode || printJob2.productCode.trim() === '')) {
        return {
          success: false,
          message: 'Mã vạch thứ hai không được để trống'
        };
      }

      if (quantity <= 0 || quantity > 100) {
        return {
          success: false,
          message: 'Số lượng in phải từ 1 đến 100'
        };
      }

      // Generate dual barcode command
      const labelCommand = this.generateDualBarcodeCommand(printJob1, printJob2);
      
      // Print multiple copies if needed
      const printCommands: Uint8Array[] = [];
      for (let i = 0; i < quantity; i++) {
        printCommands.push(labelCommand);
        if (i < quantity - 1) {
          // Small delay between labels
          printCommands.push(new Uint8Array([0x1B, 0x64, 0x01])); // Feed 1 line
        }
      }
      
      const finalCommand = this.combineCommands(printCommands);
      
      // Try multiple communication methods
      const methods = [
        () => this.sendViaProxy(finalCommand),
        () => this.sendViaCapacitor(finalCommand),
        () => this.sendViaWebSocket(finalCommand),
        () => this.sendViaHTTP(finalCommand)
      ];

      let lastError = '';
      
      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            const barcodeCount = printJob2 ? 2 : 1;
            return {
              success: true,
              message: `✅ Đã in ${quantity} nhãn với ${barcodeCount} mã vạch thành công`
            };
          }
          lastError = result.message;
        } catch (error) {
          lastError = this.getErrorMessage(error);
          continue;
        }
      }

      return {
        success: false,
        message: `❌ Không thể kết nối đến máy in Xprinter 365B. Lỗi: ${lastError}`
      };
      
    } catch (error) {
      console.error('Dual barcode print job error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Split text into lines with maximum characters per line
   */
  private splitTextToLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, truncate it
          lines.push(word.substring(0, maxCharsPerLine));
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 2); // Max 2 lines for 22mm height
  }

  /**
   * Enhanced print method with barcode type support
   */
  async printBarcodeLabel(
    printJob: PrintJob, 
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      // Validate print job
      if (!printJob.productCode || printJob.productCode.trim() === '') {
        return {
          success: false,
          message: 'Mã vạch không được để trống'
        };
      }

      if (quantity <= 0 || quantity > 100) {
        return {
          success: false,
          message: 'Số lượng in phải từ 1 đến 100'
        };
      }

      // Basic validation for Code128 barcode data
      if (!printJob.productCode || printJob.productCode.trim().length === 0) {
        return {
          success: false,
          message: 'Mã sản phẩm không được để trống'
        };
      }

      // Generate optimized ESC/POS commands for Xprinter 365B
      const labelCommand = this.generateXprinter365BLabelCommand(printJob);
      
      // Print multiple copies if needed
      const printCommands: Uint8Array[] = [];
      for (let i = 0; i < quantity; i++) {
        printCommands.push(labelCommand);
        if (i < quantity - 1) {
          // Small delay between labels
          printCommands.push(new Uint8Array([0x1B, 0x64, 0x01])); // Feed 1 line
        }
      }
      
      const finalCommand = this.combineCommands(printCommands);
      
      // Try multiple communication methods
      const methods = [
        () => this.sendViaProxy(finalCommand),
        () => this.sendViaCapacitor(finalCommand),
        () => this.sendViaWebSocket(finalCommand),
        () => this.sendViaHTTP(finalCommand)
      ];

      let lastError = '';
      
      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            return {
              success: true,
              message: `✅ Đã in ${quantity} nhãn Code128 thành công cho sản phẩm: ${printJob.productName || printJob.productCode}`
            };
          }
          lastError = result.message;
        } catch (error) {
          lastError = this.getErrorMessage(error);
          continue;
        }
      }

      return {
        success: false,
        message: `❌ Không thể kết nối đến máy in Xprinter 365B. Lỗi: ${lastError}`
      };
      
    } catch (error) {
      console.error('Barcode print job error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Generate text command with encoding
   */
  private generateTextCommand(text: string, options: {
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    fontSize?: 'normal' | 'small';
    newLine?: boolean;
  } = {}): Uint8Array {
    const commands = this.getESCPOSCommands();
    const textData = new TextEncoder().encode(text);
    
    const commandArray: Uint8Array[] = [];

    // Font size
    if (options.fontSize === 'small') {
      commandArray.push(commands.FONT_SIZE_SMALL);
    } else {
      commandArray.push(commands.FONT_SIZE_NORMAL);
    }

    // Bold
    if (options.bold) {
      commandArray.push(commands.BOLD_ON);
    }

    // Alignment
    switch (options.align) {
      case 'center':
        commandArray.push(commands.ALIGN_CENTER);
        break;
      case 'right':
        commandArray.push(commands.ALIGN_RIGHT);
        break;
      default:
        commandArray.push(commands.ALIGN_LEFT);
    }

    // Text data
    commandArray.push(textData);

    // Reset formatting
    if (options.bold) {
      commandArray.push(commands.BOLD_OFF);
    }

    // New line
    if (options.newLine !== false) {
      commandArray.push(new Uint8Array([0x0A]));
    }

    return this.combineCommands(commandArray);
  }

  /**
   * Combine multiple command arrays
   */
  private combineCommands(commands: Uint8Array[]): Uint8Array {
    const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const cmd of commands) {
      result.set(cmd, offset);
      offset += cmd.length;
    }

    return result;
  }

  /**
   * Generate complete label print command for 35x22mm labels
   */
  public generateLabelCommand(printJob: PrintJob): Uint8Array {
    const commands = this.getESCPOSCommands();
    const commandSequence: Uint8Array[] = [];

    // Initialize printer
    commandSequence.push(commands.INIT);
    
    // Set tight line spacing for compact labels
    commandSequence.push(commands.LINE_SPACING_TIGHT);

    // Product name (centered, small font, bold)
    if (printJob.productName) {
      const truncatedName = printJob.productName.length > 20 
        ? printJob.productName.substring(0, 20) + '...'
        : printJob.productName;
      
      commandSequence.push(
        this.generateTextCommand(truncatedName, {
          align: 'center',
          fontSize: 'small',
          bold: true
        })
      );
    }

    // Small spacing
    commandSequence.push(new Uint8Array([0x0A]));

    // Barcode (centered)
    if (printJob.productCode) {
      commandSequence.push(commands.ALIGN_CENTER);
      commandSequence.push(this.generateBarcodeCommand(printJob.productCode));
    }

    // Paper feed and cut (for label printers)
    commandSequence.push(commands.PAPER_FEED);

    return this.combineCommands(commandSequence);
  }

  /**
   * Send print job to the network printer
   */
  async printLabel(printJob: PrintJob): Promise<PrinterResponse> {
    try {
      // Validate print job
      if (!printJob.productCode || printJob.productCode.trim() === '') {
        return {
          success: false,
          message: 'Mã vạch không được để trống'
        };
      }

      if (printJob.quantity <= 0 || printJob.quantity > 100) {
        return {
          success: false,
          message: 'Số lượng in phải từ 1 đến 100'
        };
      }

      // Generate ESC/POS commands for the label
      const labelCommand = this.generateLabelCommand(printJob);
      
      // Try multiple communication methods
      const methods = [
        () => this.sendViaCapacitor(labelCommand),
        () => this.sendViaProxy(labelCommand),
        () => this.sendViaWebSocket(labelCommand),
        () => this.sendViaHTTP(labelCommand)
      ];

      let lastError = '';
      
      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            return {
              success: true,
              message: `Đã gửi lệnh in ${printJob.quantity} nhãn thành công`
            };
          }
          lastError = result.message;
        } catch (error) {
          lastError = this.getErrorMessage(error);
          continue;
        }
      }

      return {
        success: false,
        message: `Không thể kết nối đến máy in. Lỗi cuối: ${lastError}`
      };
      
    } catch (error) {
      console.error('Print job error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Test connection to the printer using multiple methods
   */
  async testConnection(): Promise<PrinterStatus> {
    try {
      // Validate IP address format
      if (!this.isValidIPAddress(this.config.ipAddress)) {
        return {
          isConnected: false,
          errorMessage: 'Địa chỉ IP không hợp lệ'
        };
      }

      // Validate port range
      if (this.config.port < 1 || this.config.port > 65535) {
        return {
          isConnected: false,
          errorMessage: 'Cổng phải từ 1 đến 65535'
        };
      }

      // Create a simple status command
      const statusCommand = new Uint8Array([0x10, 0x04, 0x01]); // DLE EOT n (Real-time status)
      
      // Try different connection methods
      const methods = [
        () => this.sendViaCapacitor(statusCommand),
        () => this.sendViaProxy(statusCommand),
        () => this.sendViaWebSocket(statusCommand),
        () => this.sendViaHTTP(statusCommand)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            return {
              isConnected: true,
              printerModel: 'Xprinter 365B',
              ipAddress: this.config.ipAddress,
              port: this.config.port
            };
          }
        } catch (error) {
          continue;
        }
      }

      return {
        isConnected: false,
        errorMessage: 'Không thể kết nối đến máy in. Vui lòng kiểm tra các giải pháp bên dưới.'
      };
      
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        isConnected: false,
        errorMessage: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Method 1: Send via Capacitor plugin (for mobile apps)
   */
  private async sendViaCapacitor(data: Uint8Array): Promise<PrinterResponse> {
    // Check if running in Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        // This would require a custom Capacitor plugin
        const { NetworkPrinter } = (window as any).Capacitor.Plugins;
        
        if (NetworkPrinter) {
          const result = await NetworkPrinter.print({
            ipAddress: this.config.ipAddress,
            port: this.config.port,
            data: Array.from(data)
          });
          
          return {
            success: result.success,
            message: result.message || 'Printed via Capacitor'
          };
        }
      } catch (error) {
        console.log('Capacitor method not available:', error);
      }
    }
    
    throw new Error('Capacitor method not available');
  }

  /**
   * Method 2: Send via local proxy server
   */
  private async sendViaProxy(data: Uint8Array): Promise<PrinterResponse> {
    try {
      const proxyUrl = 'http://localhost:8080/print'; // Local proxy server
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: this.config.ipAddress,
          printerPort: this.config.port,
          data: Array.from(data)
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Printed via proxy server'
        };
      } else {
        throw new Error(`Proxy server error: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Proxy method failed: ${(error as Error).message}`);
    }
  }

  /**
   * Method 3: Send via WebSocket bridge
   */
  private async sendViaWebSocket(data: Uint8Array): Promise<PrinterResponse> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket('ws://localhost:8081'); // WebSocket bridge server
        
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'print',
            printerIP: this.config.ipAddress,
            printerPort: this.config.port,
            data: Array.from(data)
          }));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          ws.close();
          
          if (response.success) {
            resolve({
              success: true,
              message: 'Printed via WebSocket bridge'
            });
          } else {
            reject(new Error(response.message));
          }
        };

        ws.onerror = () => {
          reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = () => {
          reject(new Error('WebSocket connection closed'));
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket timeout'));
        }, 5000);

      } catch (error) {
        reject(new Error(`WebSocket method failed: ${(error as Error).message}`));
      }
    });
  }

  /**
   * Method 4: Direct HTTP (will likely fail due to CORS)
   */
  private async sendViaHTTP(data: Uint8Array): Promise<PrinterResponse> {
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        const url = `http://${this.config.ipAddress}:${this.config.port}`;
        
        // Set timeout
        xhr.timeout = this.config.timeout;
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              message: 'Printed via direct HTTP'
            });
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Direct HTTP method failed - CORS or network error'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Direct HTTP timeout'));
        };

        // Open connection
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        
        // Convert Uint8Array to Blob for sending
        const blob = new Blob([data], { type: 'application/octet-stream' });
        xhr.send(blob);
        
      } catch (error) {
        reject(new Error(`Direct HTTP method failed: ${(error as Error).message}`));
      }
    });
  }

  /**
   * Validate IP address format
   */
  private isValidIPAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        return 'Lỗi kết nối mạng. Kiểm tra kết nối internet và địa chỉ IP máy in.';
      }
      
      // Timeout errors
      if (error.message.includes('timeout')) {
        return 'Hết thời gian chờ kết nối. Máy in có thể đang bận hoặc không phản hồi.';
      }
      
      // CORS errors (common in web applications)
      if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        return 'Lỗi bảo mật trình duyệt. Cần cấu hình CORS trên máy in hoặc sử dụng proxy server.';
      }
      
      // Connection refused
      if (error.message.includes('refused') || error.message.includes('ECONNREFUSED')) {
        return 'Máy in từ chối kết nối. Kiểm tra địa chỉ IP và cổng kết nối.';
      }
      
      // Host not found
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        return 'Không tìm thấy máy in tại địa chỉ IP đã cung cấp.';
      }
      
      return error.message;
    }
    
    return 'Đã xảy ra lỗi không xác định khi kết nối với máy in.';
  }

  /**
   * Batch print multiple barcode pairs using the enhanced proxy server
   */
  async printBatchBarcodes(
    barcodePairs: Array<[PrintJob, PrintJob?]>,
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      // Validate input
      if (!barcodePairs || barcodePairs.length === 0) {
        return {
          success: false,
          message: 'Danh sách mã vạch không được để trống'
        };
      }

      if (quantity <= 0 || quantity > 100) {
        return {
          success: false,
          message: 'Số lượng in phải từ 1 đến 100'
        };
      }

      // Validate each barcode pair
      for (let i = 0; i < barcodePairs.length; i++) {
        const [job1, job2] = barcodePairs[i];
        if (!job1?.productCode || job1.productCode.trim() === '') {
          return {
            success: false,
            message: `Mã vạch thứ ${i + 1} không được để trống`
          };
        }
        if (job2 && (!job2.productCode || job2.productCode.trim() === '')) {
          return {
            success: false,
            message: `Mã vạch thứ hai trong cặp ${i + 1} không được để trống`
          };
        }
      }

      // Format data for proxy server
      const formattedPairs = barcodePairs.map(([job1, job2]) => {
        const pair: any[] = [{
          productCode: job1.productCode,
          productName: job1.productName || job1.productCode
        }];
        
        if (job2) {
          pair.push({
            productCode: job2.productCode,
            productName: job2.productName || job2.productCode
          });
        }
        
        return pair;
      });

      const response = await this.sendBatchPrintRequest(formattedPairs, quantity);
      
      if (response.success) {
        const totalBarcodes = barcodePairs.reduce((sum, pair) => sum + (pair[1] ? 2 : 1), 0);
        return {
          success: true,
          message: `✅ Đã in ${quantity} bộ nhãn với ${totalBarcodes} mã vạch thành công`
        };
      }

      return response;
      
    } catch (error) {
      console.error('Batch print error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Print using the enhanced proxy server's generate-and-print endpoint
   */
  async printWithProxyGeneration(
    barcodes: [PrintJob, PrintJob?],
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      // Validate input
      const [job1, job2] = barcodes;
      if (!job1?.productCode || job1.productCode.trim() === '') {
        return {
          success: false,
          message: 'Mã vạch đầu tiên không được để trống'
        };
      }

      if (job2 && (!job2.productCode || job2.productCode.trim() === '')) {
        return {
          success: false,
          message: 'Mã vạch thứ hai không được để trống'
        };
      }

      if (quantity <= 0 || quantity > 100) {
        return {
          success: false,
          message: 'Số lượng in phải từ 1 đến 100'
        };
      }

      // Format data for proxy server
      const formattedBarcodes = [{
        productCode: job1.productCode,
        productName: job1.productName || job1.productCode
      }];

      if (job2) {
        formattedBarcodes.push({
          productCode: job2.productCode,
          productName: job2.productName || job2.productCode
        });
      }

      const response = await this.sendGenerateAndPrintRequest(formattedBarcodes, quantity);
      
      if (response.success) {
        const barcodeCount = job2 ? 2 : 1;
        return {
          success: true,
          message: `✅ Đã in ${quantity} nhãn với ${barcodeCount} mã vạch thành công`
        };
      }

      return response;
      
    } catch (error) {
      console.error('Proxy generation print error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Enhanced method to efficiently send barcode data to proxy server for horizontal printing
   */
  async printHorizontalBarcodes(
    barcodes: Array<{ productCode: string; productName?: string }>,
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      if (!barcodes || barcodes.length === 0) {
        return {
          success: false,
          message: 'Danh sách mã vạch không được để trống'
        };
      }

      // Validate barcode data
      for (const barcode of barcodes) {
        if (!barcode.productCode || barcode.productCode.trim() === '') {
          return {
            success: false,
            message: 'Tất cả mã vạch phải có productCode'
          };
        }
      }

      // Use proxy generation for optimal horizontal layout
      const proxyUrl = 'http://localhost:8080/generate-and-print';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: this.config.ipAddress,
          printerPort: this.config.port,
          barcodes: barcodes.map(b => ({
            productCode: b.productCode.trim(),
            productName: b.productName?.trim() || ''
          })),
          quantity
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || 'In mã vạch ngang thành công'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Lỗi khi in mã vạch ngang'
        };
      }
    } catch (error) {
      console.error('Horizontal barcode print error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Enhanced batch printing method for multiple horizontal barcode pairs
   */
  async printBatchHorizontalBarcodes(
    barcodePairs: Array<Array<{ productCode: string; productName?: string }>>,
    quantity: number = 1
  ): Promise<PrinterResponse> {
    try {
      if (!barcodePairs || barcodePairs.length === 0) {
        return {
          success: false,
          message: 'Danh sách cặp mã vạch không được để trống'
        };
      }

      // Validate all barcode pairs
      for (let i = 0; i < barcodePairs.length; i++) {
        const pair = barcodePairs[i];
        if (!pair || pair.length === 0) {
          return {
            success: false,
            message: `Cặp mã vạch thứ ${i + 1} không hợp lệ`
          };
        }
        
        for (const barcode of pair) {
          if (!barcode.productCode || barcode.productCode.trim() === '') {
            return {
              success: false,
              message: `Mã vạch trong cặp thứ ${i + 1} không hợp lệ`
            };
          }
        }
      }

      const proxyUrl = 'http://localhost:8080/batch-print';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: this.config.ipAddress,
          printerPort: this.config.port,
          barcodePairs: barcodePairs.map(pair => 
            pair.map(b => ({
              productCode: b.productCode.trim(),
              productName: b.productName?.trim() || ''
            }))
          ),
          quantity
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || `In thành công ${barcodePairs.length} cặp mã vạch`
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Lỗi khi in batch mã vạch ngang'
        };
      }
    } catch (error) {
      console.error('Batch horizontal barcode print error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }
  async generateBarcodeImage(
    productCode: string,
    options?: { width?: number; height?: number; format?: 'png' | 'svg' }
  ): Promise<{ success: boolean; imageData?: string; message: string }> {
    try {
      if (!productCode || productCode.trim() === '') {
        return {
          success: false,
          message: 'Mã vạch không được để trống'
        };
      }

      const proxyUrl = 'http://localhost:8080/generate-barcode-image';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCode: productCode.trim(),
          options: {
            width: options?.width || 200,
            height: options?.height || 100,
            format: options?.format || 'png'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          imageData: result.data?.imageBase64,
          message: result.message || 'Tạo hình ảnh mã vạch thành công'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || `Lỗi server: ${response.status}`
        };
      }
    } catch (error) {
      console.error('Generate barcode image error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Send batch print request to proxy server
   */
  private async sendBatchPrintRequest(
    barcodePairs: Array<Array<{ productCode: string; productName: string }>>,
    quantity: number
  ): Promise<PrinterResponse> {
    try {
      const proxyUrl = 'http://localhost:8080/batch-print';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: this.config.ipAddress,
          printerPort: this.config.port,
          barcodePairs,
          quantity
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || 'In batch thành công'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || `Lỗi proxy server: ${response.status}`
        };
      }
    } catch (error) {
      throw new Error(`Batch print request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Send generate-and-print request to proxy server
   */
  private async sendGenerateAndPrintRequest(
    barcodes: Array<{ productCode: string; productName: string }>,
    quantity: number
  ): Promise<PrinterResponse> {
    try {
      const proxyUrl = 'http://localhost:8080/generate-and-print';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: this.config.ipAddress,
          printerPort: this.config.port,
          barcodes,
          quantity
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || 'In thành công'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || `Lỗi proxy server: ${response.status}`
        };
      }
    } catch (error) {
      throw new Error(`Generate-and-print request failed: ${(error as Error).message}`);
    }
  }

}

/**
 * Factory function to create printer service instance
 */
export const createXprinterService = (config: PrinterConfig): XprinterService => {
  return new XprinterService(config);
};

/**
 * Default printer configuration for Xprinter 365B
 */
export const DEFAULT_XPRINTER_CONFIG: Omit<PrinterConfig, 'ipAddress'> = {
  port: 9100, // Standard ESC/POS port
  timeout: 5000
};