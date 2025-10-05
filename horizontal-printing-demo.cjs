const http = require('http');

/**
 * Demonstration script for horizontal printing with 2 barcodes per line
 * This script shows how to use the enhanced system for efficient barcode printing
 */

const PROXY_URL = 'http://localhost:8080';
const PRINTER_IP = '192.168.1.135';
const PRINTER_PORT = 9100;

/**
 * Helper function to make HTTP requests using native Node.js http module
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => jsonData });
        } catch (error) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, text: () => data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function demonstrateHorizontalPrinting() {
  console.log('🖨️  Horizontal Printing Demonstration');
  console.log('=====================================');
  
  try {
    // Demo 1: Single horizontal pair
    console.log('\n📄 Demo 1: Printing single horizontal barcode pair');
    const singlePairResponse = await makeRequest(`${PROXY_URL}/generate-and-print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: PRINTER_IP,
        printerPort: PRINTER_PORT,
        barcodes: [
          { productCode: 'NK12304', productName: 'Kingtony - CHỈ 1#' },
          { productCode: 'NK12305', productName: 'Kingtony - CHỈ 2#' }
        ],
        quantity: 1
      })
    });

    const singleResult = await singlePairResponse.json();
    console.log('✅ Single pair result:', singleResult.message);

    // Demo 2: Batch printing multiple horizontal pairs
    console.log('\n📦 Demo 2: Batch printing multiple horizontal pairs');
    const batchResponse = await makeRequest(`${PROXY_URL}/batch-print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: PRINTER_IP,
        printerPort: PRINTER_PORT,
        barcodePairs: [
          [
            { productCode: 'NK12306', productName: 'Kingtony - CHỈ 3#' },
            { productCode: 'NK12307', productName: 'Kingtony - CHỈ 4#' }
          ],
          [
            { productCode: 'NK12308', productName: 'Kingtony - CHỈ 5#' },
            { productCode: 'NK12309', productName: 'Kingtony - CHỈ 6#' }
          ],
          [
            { productCode: 'NK12310', productName: 'Kingtony - CHỈ 7#' }
            // Single barcode in this pair
          ]
        ],
        quantity: 1
      })
    });

    const batchResult = await batchResponse.json();
    console.log('✅ Batch result:', batchResult.message);

    // Demo 3: Generate barcode image for preview
    console.log('\n🖼️  Demo 3: Generating barcode image for preview');
    const imageResponse = await makeRequest(`${PROXY_URL}/generate-barcode-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productCode: 'NK12304',
        productName: 'Kingtony - CHỈ 1#',
        options: { width: 200, height: 100 }
      })
    });

    const imageResult = await imageResponse.json();
    if (imageResult.success) {
      console.log('✅ Image generated successfully');
      console.log(`📏 Image size: ${imageResult.data.imageBase64.length} characters (base64)`);
    }

    console.log('\n🎉 Horizontal printing demonstration completed!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   • 2 barcodes per line horizontal layout');
    console.log('   • Optimized spacing and alignment');
    console.log('   • Batch printing for efficiency');
    console.log('   • Barcode image generation');
    console.log('   • Reliable client-proxy-printer communication');

  } catch (error) {
    console.error('❌ Demo error:', error.message);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateHorizontalPrinting();
}

module.exports = { demonstrateHorizontalPrinting };