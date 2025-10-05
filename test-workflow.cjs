/**
 * Test script to validate the complete workflow from client to printer
 * This script tests all the enhanced proxy server endpoints
 */

const BASE_URL = 'http://localhost:8080';

// Test data
const testPrinterIP = '192.168.1.135';
const testPrinterPort = 9100;

// Test functions
async function testGenerateAndPrint() {
  console.log('\n🧪 Testing Generate-and-Print endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/generate-and-print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: testPrinterIP,
        printerPort: testPrinterPort,
        barcodes: [
          { productCode: 'TEST001', productName: 'Test Product 1' },
          { productCode: 'TEST002', productName: 'Test Product 2' }
        ],
        quantity: 1
      })
    });

    const result = await response.json();
    console.log('✅ Generate-and-Print Response:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Generate-and-Print Error:', error.message);
    return false;
  }
}

async function testBatchPrint() {
  console.log('\n🧪 Testing Batch Print endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/batch-print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: testPrinterIP,
        printerPort: testPrinterPort,
        barcodePairs: [
          [
            { productCode: 'BATCH001', productName: 'Batch Item 1' },
            { productCode: 'BATCH002', productName: 'Batch Item 2' }
          ],
          [
            { productCode: 'BATCH003', productName: 'Batch Item 3' }
          ]
        ],
        quantity: 1
      })
    });

    const result = await response.json();
    console.log('✅ Batch Print Response:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Batch Print Error:', error.message);
    return false;
  }
}

async function testGenerateBarcodeImage() {
  console.log('\n🧪 Testing Generate Barcode Image endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/generate-barcode-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productCode: 'IMAGE001',
        options: {
          width: 200,
          height: 100,
          format: 'png'
        }
      })
    });

    const result = await response.json();
    console.log('✅ Generate Barcode Image Response:', {
      success: result.success,
      hasImageData: !!result.imageData,
      imageDataLength: result.imageData ? result.imageData.length : 0
    });
    return result.success;
  } catch (error) {
    console.error('❌ Generate Barcode Image Error:', error.message);
    return false;
  }
}

async function testServerHealth() {
  console.log('\n🧪 Testing Server Health...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const result = await response.json();
    console.log('✅ Server Health Response:', result);
    return response.ok;
  } catch (error) {
    console.error('❌ Server Health Error:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Workflow Tests...');
  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log(`🖨️  Target Printer: ${testPrinterIP}:${testPrinterPort}`);
  
  const results = {
    health: await testServerHealth(),
    generateImage: await testGenerateBarcodeImage(),
    generateAndPrint: await testGenerateAndPrint(),
    batchPrint: await testBatchPrint()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Workflow validation completed successfully!');
    console.log('The system is ready for horizontal printing with dual barcodes.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }

  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests, testGenerateAndPrint, testBatchPrint, testGenerateBarcodeImage, testServerHealth };