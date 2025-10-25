const axios = require('axios');

async function testPythonServer() {
  try {
    console.log('Testing Python AI server...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('Health check:', healthResponse.data);
    
    // Test basic connection
    const homeResponse = await axios.get('http://localhost:5001/');
    console.log('Home endpoint:', homeResponse.data);
    
    console.log('✅ Python server is working correctly!');
  } catch (error) {
    console.error('❌ Python server test failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPythonServer();