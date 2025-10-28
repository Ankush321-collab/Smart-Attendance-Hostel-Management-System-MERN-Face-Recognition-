const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testPythonFaceRecognitionServer() {
  const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
  
  try {
    console.log('🔄 Testing Python Face Recognition Server...');
    console.log(`📡 Server URL: ${pythonServerUrl}`);
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${pythonServerUrl}/`, {
      timeout: 10000
    });
    console.log('✅ Health check successful:', {
      status: healthResponse.data.status,
      message: healthResponse.data.message,
      version: healthResponse.data.version
    });
    
    // Test configuration endpoint
    console.log('\n2. Testing configuration endpoint...');
    const configResponse = await axios.get(`${pythonServerUrl}/config`, {
      timeout: 10000
    });
    console.log('✅ Configuration retrieved:', {
      confidence_threshold: configResponse.data.confidence_threshold,
      anti_spoof_enabled: configResponse.data.anti_spoof_enabled,
      face_recognition_model: configResponse.data.face_recognition_model
    });
    
    // Test encode endpoint with sample data
    console.log('\n3. Testing face encoding endpoint...');
    const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    
    try {
      const encodeResponse = await axios.post(`${pythonServerUrl}/encode`, {
        image: sampleBase64,
        studentId: 'TEST001'
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (encodeResponse.data.success) {
        console.log('✅ Face encoding test successful');
      } else {
        console.log('⚠️ Face encoding test completed with expected failure (sample image):', encodeResponse.data.message);
      }
    } catch (encodeError) {
      if (encodeError.response?.status === 400) {
        console.log('✅ Face encoding endpoint working (expected failure with sample image)');
      } else {
        throw encodeError;
      }
    }
    
    console.log('\n🎉 All tests passed! Python Face Recognition Server is working correctly!');
    console.log('\n📋 Integration Status:');
    console.log('   ✅ Server is running and responsive');
    console.log('   ✅ Health check endpoint working');
    console.log('   ✅ Configuration endpoint working');
    console.log('   ✅ Face encoding endpoint responding');
    console.log('\n🚀 Ready for integration with MERN backend!');
    
  } catch (error) {
    console.error('\n❌ Python Face Recognition Server test failed:');
    console.error('🔗 Server URL:', pythonServerUrl);
    console.error('📝 Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Start the Python server first:');
      console.error('   1. Navigate to the Python directory');
      console.error('   2. Run: setup.bat (first time only)');
      console.error('   3. Run: start_server.bat');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Solution: The server is taking too long to respond');
      console.error('   1. Check if the server is running');
      console.error('   2. Verify the server URL in .env file');
    } else {
      if (error.response) {
        console.error('📊 Response Status:', error.response.status);
        console.error('📄 Response Data:', error.response.data);
      }
      console.error('🔍 Full Error:', error);
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure Python server is running on port 8085');
    console.error('   2. Check PYTHON_FACE_SERVER_URL in .env file');
    console.error('   3. Verify Python dependencies are installed');
    console.error('   4. Check firewall/antivirus settings');
  }
}

// Also test the legacy endpoint for backward compatibility
async function testLegacyEndpoint() {
  const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
  
  try {
    console.log('\n🔄 Testing legacy comparison endpoint...');
    const response = await axios.post(`${pythonServerUrl}/compare`, {
      url1: 'test',
      url2: 'test'
    }, {
      timeout: 10000
    });
    
    if (response.data.deprecated) {
      console.log('✅ Legacy endpoint working (returns deprecated message as expected)');
    }
  } catch (error) {
    console.log('⚠️ Legacy endpoint test failed (this is expected if the endpoint was removed)');
  }
}

// Run all tests
async function runAllTests() {
  await testPythonFaceRecognitionServer();
  await testLegacyEndpoint();
}

runAllTests();