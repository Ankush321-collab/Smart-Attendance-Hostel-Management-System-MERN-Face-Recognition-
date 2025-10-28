const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const FaceEncoding = require('./models/FaceEncoding');
const User = require('./models/User');

// Load environment variables
dotenv.config();

async function checkIntegrationStatus() {
  console.log('🔍 Checking Face Recognition Integration Status');
  console.log('='.repeat(50));

  try {
    // 1. Check MongoDB connection
    console.log('\n1. 📊 Checking MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // 2. Check existing face enrollments
    console.log('\n2. 👥 Checking existing face enrollments...');
    const totalUsers = await User.countDocuments();
    const enrolledUsers = await User.countDocuments({ isFaceEnrolled: true });
    const faceEncodings = await FaceEncoding.countDocuments({ isActive: true });
    
    console.log(`   📊 Total users: ${totalUsers}`);
    console.log(`   🎯 Enrolled users: ${enrolledUsers}`);
    console.log(`   💾 Active face encodings: ${faceEncodings}`);

    // 3. List enrolled students
    if (faceEncodings > 0) {
      console.log('\n📋 Enrolled Students:');
      const enrolledStudents = await FaceEncoding.find({ isActive: true })
        .populate('student', 'name studentId email')
        .limit(5);
      
      enrolledStudents.forEach((enrollment, index) => {
        console.log(`   ${index + 1}. ${enrollment.student.name} (${enrollment.studentId})`);
        console.log(`      📅 Enrolled: ${enrollment.enrollmentDate.toLocaleDateString()}`);
        console.log(`      🔢 Encoding length: ${enrollment.encoding.length}`);
      });
      
      if (faceEncodings > 5) {
        console.log(`   ... and ${faceEncodings - 5} more`);
      }
    }

    // 4. Check Python server
    console.log('\n3. 🐍 Checking Python Server Connection...');
    const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
    
    try {
      const response = await axios.get(`${pythonServerUrl}/`, {
        timeout: 5000
      });
      
      console.log('✅ Python server is running');
      console.log(`   📡 URL: ${pythonServerUrl}`);
      console.log(`   🎯 Status: ${response.data.status}`);
      console.log(`   📝 Message: ${response.data.message}`);
      console.log(`   🏷️  Version: ${response.data.version}`);

      // Test config endpoint
      const configResponse = await axios.get(`${pythonServerUrl}/config`);
      console.log(`   ⚙️  Mode: ${configResponse.data.mode || 'production'}`);
      console.log(`   🎚️  Confidence threshold: ${configResponse.data.confidence_threshold}`);
      
    } catch (pythonError) {
      console.log('❌ Python server is not running');
      console.log(`   📡 Expected URL: ${pythonServerUrl}`);
      console.log(`   💡 Solution: Start the Python server first`);
      
      if (pythonError.code === 'ECONNREFUSED') {
        console.log('   🔧 Run: cd Python && python face_recognition_server_simplified.py');
      }
    }

    // 5. Check environment configuration
    console.log('\n4. ⚙️  Checking Environment Configuration...');
    console.log(`   🗄️  MongoDB URI: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   🐍 Python Server URL: ${process.env.PYTHON_FACE_SERVER_URL || 'Using default (http://localhost:8085)'}`);
    console.log(`   🎭 Mock Mode: ${process.env.MOCK_FACE_RECOGNITION || 'false'}`);
    console.log(`   🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);

    // 6. Integration readiness check
    console.log('\n5. ✅ Integration Readiness Check...');
    
    const checks = {
      database: true,
      pythonServer: false,
      configuration: !!process.env.MONGODB_URI && !!process.env.JWT_SECRET
    };

    try {
      await axios.get(`${pythonServerUrl}/`, { timeout: 3000 });
      checks.pythonServer = true;
    } catch (e) {
      // Python server not running
    }

    const allReady = Object.values(checks).every(check => check);
    
    console.log(`   🗄️  Database: ${checks.database ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`   🐍 Python Server: ${checks.pythonServer ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`   ⚙️  Configuration: ${checks.configuration ? '✅ Ready' : '❌ Not Ready'}`);
    
    console.log(`\n🎯 Overall Status: ${allReady ? '✅ READY FOR INTEGRATION' : '⚠️  NEEDS SETUP'}`);

    // 7. Recommendations
    console.log('\n6. 💡 Recommendations...');
    
    if (faceEncodings > 0) {
      console.log('   ♻️  Face Data: You have existing face enrollments');
      console.log('   📝 Recommendation: You can continue with existing data or clear it for fresh start');
      console.log('   🗑️  To clear old data: db.faceencodings.deleteMany({}); db.users.updateMany({}, {$set: {isFaceEnrolled: false}})');
    } else {
      console.log('   🆕 Face Data: No existing enrollments found');
      console.log('   📝 Recommendation: Ready for fresh face registrations');
    }

    if (!checks.pythonServer) {
      console.log('   🐍 Python Server: Start the server for face recognition');
      console.log('   📝 Commands: cd Python && python face_recognition_server_simplified.py');
    }

    console.log('\n🎉 Integration check completed!');

  } catch (error) {
    console.error('❌ Error during integration check:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the check
checkIntegrationStatus();