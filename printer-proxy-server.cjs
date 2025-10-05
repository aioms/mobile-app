#!/usr/bin/env node

/**
 * Enhanced Printer Proxy Server
 * A Node.js server to bridge web app and network printer communication
 * Features:
 * - Direct ESC/POS command forwarding using node-thermal-printer
 * - Barcode generation and automatic printing
 * - Batch printing support for dual barcode layouts
 * - Reliable communication with retry mechanisms
 */

const express = require('express');
const cors = require('cors');
const net = require('net');
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const app = express();

// Enable CORS for all origins (adjust for production)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 8080;

/**
 * Generate thermal printer commands for dual barcode layout using node-thermal-printer
 */
async function generateDualBarcodeLayout(barcode1, barcode2 = null, printerIP, printerPort) {
  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${printerIP}:${printerPort}`,
    characterSet: CharacterSet.PC852_LATIN2,
    removeSpecialCharacters: false,
    lineCharacter: "=",
    breakLine: BreakLine.WORD,
    options:{
      timeout: 5000,
    }
  });

  // Clear any previous content
  printer.clear();

  if (barcode2) {
    // Dual label layout - side by side
    
    // === PRODUCT NAMES ROW ===
    printer.alignLeft();
    
    // Product Name (left label) - Bold and normal font
    if (barcode1.productName && barcode1.productName.trim()) {
      printer.bold(true);
      const truncatedName = barcode1.productName.length > 14 ? 
        barcode1.productName.substring(0, 14) + '...' : barcode1.productName;
      printer.print(truncatedName.padEnd(20, ' ')); // Pad to ensure spacing
      printer.bold(false);
    } else {
      printer.print(''.padEnd(20, ' ')); // Empty space for alignment
    }
    
    // Product Name (right label) - Bold and normal font
    if (barcode2.productName && barcode2.productName.trim()) {
      printer.bold(true);
      const truncatedName = barcode2.productName.length > 14 ? 
        barcode2.productName.substring(0, 14) + '...' : barcode2.productName;
      printer.print(truncatedName);
      printer.bold(false);
    }
    
    printer.newLine();
    
    // === PRODUCT CODES ROW ===
    printer.alignLeft();
    
    // Product Code (left label)
    if (barcode1.productCode && barcode1.productCode.trim()) {
      printer.setTextSize(0, 0); // Small font
      printer.print(barcode1.productCode.padEnd(20, ' ')); // Pad to ensure spacing
    } else {
      printer.print(''.padEnd(20, ' ')); // Empty space for alignment
    }
    
    // Product Code (right label)
    if (barcode2.productCode && barcode2.productCode.trim()) {
      printer.setTextSize(0, 0); // Small font
      printer.print(barcode2.productCode);
    }
    
    printer.newLine();
    
    // === BARCODES ROW ===
    printer.alignLeft();
    
    // Left Barcode
    if (barcode1.productCode && barcode1.productCode.trim()) {
      printer.code128(barcode1.productCode, {
        width: "SMALL",
        height: 40,
        includeParity: false
      });
      
      // Add spacing for right barcode positioning
      printer.print(''.padEnd(10, ' '));
    }
    
    // Right Barcode - we need to handle this differently due to thermal printer limitations
    if (barcode2.productCode && barcode2.productCode.trim()) {
      // For dual layout, we'll print the second barcode on the same line if possible
      // Otherwise, we'll use a workaround with positioning
      printer.code128(barcode2.productCode, {
        width: "SMALL", 
        height: 40,
        includeParity: false
      });
    }
    
  } else {
    // Single label layout - centered with better spacing
    printer.alignCenter();
    
    // Product Name - Bold and larger font
    if (barcode1.productName && barcode1.productName.trim()) {
      printer.bold(true);
      printer.setTextSize(1, 1); // Double height font for prominence
      const truncatedName = barcode1.productName.length > 18 ? 
        barcode1.productName.substring(0, 18) + '...' : barcode1.productName;
      printer.println(truncatedName);
      printer.newLine();
      printer.bold(false);
    }
    
    // Product Code - Medium font with spacing
    if (barcode1.productCode && barcode1.productCode.trim()) {
      printer.setTextSize(0, 1); // Medium font
      printer.println(barcode1.productCode);
      printer.newLine();
    }
    
    // Barcode - Larger for single label
    if (barcode1.productCode && barcode1.productCode.trim()) {
      printer.code128(barcode1.productCode, {
        width: "LARGE",
        height: 80,
        includeParity: false
      });
    }
    
    printer.alignLeft(); // Reset alignment
  }
  
  // Final formatting with proper spacing
  printer.newLine();
  printer.newLine();
  printer.newLine();
  printer.partialCut();
  
  return printer;
}

/**
 * Generate barcode image using Canvas and JsBarcode
 */
function generateBarcodeImage(productCode, productName = '', options = {}) {
  const canvas = createCanvas(options.width || 200, options.height || 100);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  try {
    // Generate barcode
    JsBarcode(canvas, productCode, {
      format: 'CODE128',
      width: options.barcodeWidth || 1,
      height: options.barcodeHeight || 50,
      displayValue: true,
      text: productName || productCode,
      fontSize: options.fontSize || 12,
      textAlign: 'center',
      textPosition: 'bottom',
      background: 'white',
      lineColor: 'black'
    });
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    throw new Error(`Failed to generate barcode: ${error.message}`);
  }
}

/**
 * Generate barcode and print endpoint - receives barcode data, generates thermal printer commands, and prints
 */
app.post('/generate-and-print', async (req, res) => {
  try {
    const { printerIP, printerPort, barcodes, quantity = 1 } = req.body;

    // Validate request
    if (!printerIP || !printerPort || !barcodes || !Array.isArray(barcodes)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: printerIP, printerPort, barcodes (array)'
      });
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(printerIP)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    // Validate port range
    if (printerPort < 1 || printerPort > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Port must be between 1 and 65535'
      });
    }

    // Validate barcodes
    if (barcodes.length === 0 || barcodes.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Barcodes array must contain 1 or 2 barcode objects'
      });
    }

    // Validate each barcode
    for (const barcode of barcodes) {
      if (!barcode.productCode || barcode.productCode.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Each barcode must have a valid productCode'
        });
      }
    }

    // Generate and print using node-thermal-printer
    const barcode1 = barcodes[0];
    const barcode2 = barcodes.length > 1 ? barcodes[1] : null;
    
    // Print multiple copies if needed
    for (let i = 0; i < quantity; i++) {
      await generateDualBarcodeLayout(barcode1, barcode2, printerIP, printerPort);
      
      if (i < quantity - 1) {
        // Small delay between labels
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const barcodeCount = barcode2 ? 2 : 1;
    res.json({
      success: true,
      message: `✅ Successfully printed ${quantity} labels with ${barcodeCount} barcode(s)`,
      attempts: 1
    });

  } catch (error) {
    console.error('Generate and print error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Generate barcode image endpoint - returns base64 encoded image for better JSON compatibility
 */
app.post('/generate-barcode-image', async (req, res) => {
  try {
    const { productCode, productName, options = {} } = req.body;

    if (!productCode || productCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'productCode is required'
      });
    }

    const imageBuffer = generateBarcodeImage(productCode, productName, options);
    
    // Return base64 encoded image for better JSON compatibility
    res.json({
      success: true,
      message: 'Barcode image generated successfully',
      data: {
        productCode,
        productName: productName || '',
        imageBase64: imageBuffer.toString('base64'),
        mimeType: 'image/png'
      }
    });

  } catch (error) {
    console.error('Generate barcode image error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Batch print endpoint - handles multiple barcode pairs for efficient printing
 */
app.post('/batch-print', async (req, res) => {
  try {
    const { printerIP, printerPort, barcodePairs, quantity = 1 } = req.body;

    // Validate request
    if (!printerIP || !printerPort || !barcodePairs || !Array.isArray(barcodePairs)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: printerIP, printerPort, barcodePairs (array)'
      });
    }

    // Validate IP and port
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(printerIP)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    if (printerPort < 1 || printerPort > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Port must be between 1 and 65535'
      });
    }

    if (barcodePairs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'barcodePairs array cannot be empty'
      });
    }

    let totalBarcodes = 0;

    // Process each barcode pair
    for (const pair of barcodePairs) {
      if (!Array.isArray(pair) || pair.length === 0 || pair.length > 2) {
        return res.status(400).json({
          success: false,
          message: 'Each barcode pair must be an array with 1 or 2 barcode objects'
        });
      }

      // Validate barcodes in pair
      for (const barcode of pair) {
        if (!barcode.productCode || barcode.productCode.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Each barcode must have a valid productCode'
          });
        }
      }

      const barcode1 = pair[0];
      const barcode2 = pair.length > 1 ? pair[1] : null;
      totalBarcodes += pair.length;

      // Print multiple copies if needed
      for (let i = 0; i < quantity; i++) {
        await generateDualBarcodeLayout(barcode1, barcode2, printerIP, printerPort);
        
        // Small delay between labels (except for the last one)
        if (i < quantity - 1 || pair !== barcodePairs[barcodePairs.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    res.json({
      success: true,
      message: `✅ Successfully printed ${barcodePairs.length} labels with ${totalBarcodes} total barcodes (${quantity} copies each)`,
      attempts: 1
    });

  } catch (error) {
    console.error('Batch print error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Print endpoint - receives print data and forwards to printer (original functionality)
 */
app.post('/print', async (req, res) => {
  try {
    const { printerIP, printerPort, data } = req.body;

    // Validate request
    if (!printerIP || !printerPort || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: printerIP, printerPort, data'
      });
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(printerIP)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    // Validate port range
    if (printerPort < 1 || printerPort > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Port must be between 1 and 65535'
      });
    }

    // Convert data array back to Buffer
    const printData = Buffer.from(data);

    // Send to printer via TCP
    const result = await sendToPrinter(printerIP, printerPort, printData);
    
    res.json(result);

  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Test connection endpoint
 */
app.post('/test', async (req, res) => {
  try {
    const { printerIP, printerPort } = req.body;

    if (!printerIP || !printerPort) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: printerIP, printerPort'
      });
    }

    // Send a simple status command
    const statusCommand = Buffer.from([0x10, 0x04, 0x01]); // DLE EOT n
    const result = await sendToPrinter(printerIP, printerPort, statusCommand);
    
    res.json(result);

  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Printer proxy server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Legacy sendToPrinter function - kept for /print endpoint compatibility
 */
function sendToPrinter(printerIP, printerPort, data, retryCount = 0) {
  const maxRetries = 3;
  const timeoutDuration = 30000; // Increased to 30 seconds
  
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseData = Buffer.alloc(0);
    let isConnected = false;
    let isResolved = false;
    
    console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} - Connecting to printer at ${printerIP}:${printerPort}`);

    // Set connection timeout
    client.setTimeout(timeoutDuration);

    // Connection timeout handler
    const connectionTimeout = setTimeout(() => {
      if (!isConnected && !isResolved) {
        console.error(`Connection timeout after ${timeoutDuration}ms`);
        client.destroy();
        if (retryCount < maxRetries) {
          console.log(`Retrying connection... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            sendToPrinter(printerIP, printerPort, data, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 2000); // Wait 2 seconds before retry
        } else {
          isResolved = true;
          reject(new Error(`Connection timeout after ${maxRetries + 1} attempts. Please check: 1) Printer is powered on, 2) IP address ${printerIP} is correct, 3) Port ${printerPort} is correct, 4) Network connection is stable`));
        }
      }
    }, timeoutDuration);

    client.connect(printerPort, printerIP, () => {
      isConnected = true;
      clearTimeout(connectionTimeout);
      console.log(`✓ Connected to printer at ${printerIP}:${printerPort}`);
      
      // Log detailed data being sent
      console.log(`Sending ${data.length} bytes to printer:`);
      console.log('Data (hex):', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
      console.log('Data (decimal):', Array.from(data).join(' '));
      
      // Log readable characters
      const readableChars = Array.from(data).map(b => 
        (b >= 32 && b <= 126) ? String.fromCharCode(b) : `[${b}]`
      ).join('');
      console.log('Data (readable):', readableChars);
      
      // Send data immediately after connection
      try {
        client.write(data);
        console.log(`✅ Successfully sent ${data.length} bytes to printer`);
        console.log('Print command completed, waiting for printer response...');
        
        // Close connection after sending data (for ESC/POS printers)
        setTimeout(() => {
          if (!isResolved) {
            client.end();
          }
        }, 1000);
      } catch (writeError) {
        console.error('Error writing to printer:', writeError);
        client.destroy();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Failed to send data to printer: ${writeError.message}`));
        }
      }
    });

    client.on('data', (chunk) => {
      responseData = Buffer.concat([responseData, chunk]);
      console.log(`Received ${chunk.length} bytes from printer`);
    });

    client.on('close', () => {
      clearTimeout(connectionTimeout);
      if (!isResolved) {
        console.log('✓ Connection to printer closed successfully');
        isResolved = true;
        resolve({
          success: true,
          message: 'Data sent to printer successfully',
          responseLength: responseData.length,
          attempts: retryCount + 1
        });
      }
    });

    client.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.error('Printer connection error:', error);
      
      if (!isResolved) {
        let errorMessage = 'Unknown printer error';
        
        if (error.code === 'ECONNREFUSED') {
          errorMessage = `Connection refused to ${printerIP}:${printerPort}. Please check: 1) Printer is powered on, 2) Port ${printerPort} is correct, 3) Printer network settings`;
        } else if (error.code === 'EHOSTUNREACH') {
          errorMessage = `Host unreachable ${printerIP}. Please check: 1) IP address is correct, 2) Printer and computer are on same network, 3) Network connection is stable`;
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = `Connection timeout to ${printerIP}:${printerPort}. Printer may be busy or unresponsive`;
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = `Host not found ${printerIP}. Please verify the IP address is correct`;
        } else if (error.code === 'ENETUNREACH') {
          errorMessage = `Network unreachable to ${printerIP}. Please check network connection`;
        }

        // Retry on certain errors
        if ((error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') && retryCount < maxRetries) {
          console.log(`Retrying due to ${error.code}... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            sendToPrinter(printerIP, printerPort, data, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 3000); // Wait 3 seconds before retry
        } else {
          isResolved = true;
          reject(new Error(`${errorMessage} (after ${retryCount + 1} attempts)`));
        }
      }
    });

    client.on('timeout', () => {
      clearTimeout(connectionTimeout);
      if (!isResolved) {
        console.error('Socket timeout occurred');
        client.destroy();
        
        if (retryCount < maxRetries) {
          console.log(`Retrying due to timeout... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            sendToPrinter(printerIP, printerPort, data, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 2000);
        } else {
          isResolved = true;
          reject(new Error(`Socket timeout after ${maxRetries + 1} attempts. Please check printer connectivity`));
        }
      }
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🖨️  Enhanced Printer Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to bridge web app ↔ network printer communication`);
  console.log(`🔧 Endpoints:`);
  console.log(`   POST /print                - Send raw ESC/POS commands to printer`);
  console.log(`   POST /generate-and-print   - Generate barcode ESC/POS and print (1-2 barcodes)`);
  console.log(`   POST /batch-print          - Batch print multiple barcode pairs`);
  console.log(`   POST /generate-barcode-image - Generate barcode image (PNG)`);
  console.log(`   POST /test                 - Test printer connection`);
  console.log(`   GET  /health               - Server health check`);
  console.log(`\n💡 Usage examples:`);
  console.log(`\n📄 Generate and print dual barcodes:`);
  console.log(`   fetch('http://localhost:${PORT}/generate-and-print', {`);
  console.log(`     method: 'POST',`);
  console.log(`     headers: { 'Content-Type': 'application/json' },`);
  console.log(`     body: JSON.stringify({`);
  console.log(`       printerIP: '192.168.1.135',`);
  console.log(`       printerPort: 9100,`);
  console.log(`       barcodes: [`);
  console.log(`         { productCode: 'ABC123', productName: 'Product 1' },`);
  console.log(`         { productCode: 'DEF456', productName: 'Product 2' }`);
  console.log(`       ],`);
  console.log(`       quantity: 1`);
  console.log(`     })`);
  console.log(`   })`);
  console.log(`\n📦 Batch print multiple pairs:`);
  console.log(`   fetch('http://localhost:${PORT}/batch-print', {`);
  console.log(`     method: 'POST',`);
  console.log(`     headers: { 'Content-Type': 'application/json' },`);
  console.log(`     body: JSON.stringify({`);
  console.log(`       printerIP: '192.168.1.135',`);
  console.log(`       printerPort: 9100,`);
  console.log(`       barcodePairs: [`);
  console.log(`         [{ productCode: 'ABC123' }, { productCode: 'DEF456' }],`);
  console.log(`         [{ productCode: 'GHI789' }]`);
  console.log(`       ],`);
  console.log(`       quantity: 2`);
  console.log(`     })`);
  console.log(`   })`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down printer proxy server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down printer proxy server...');
  process.exit(0);
});