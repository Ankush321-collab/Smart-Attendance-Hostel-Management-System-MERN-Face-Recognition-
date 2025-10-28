const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FaceEncoding = require('./models/FaceEncoding');
const User = require('./models/User');

dotenv.config();

async function clearFaceData() {
  try {
    console.log('🗑️  Clearing old face enrollment data...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear all face encodings
    const deleteResult = await FaceEncoding.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} face encodings`);
    
    // Reset face enrollment status for all users
    const updateResult = await User.updateMany(
      {}, 
      { 
        $set: { 
          isFaceEnrolled: false,
          faceEncodingPath: null,
          profileImage: null
        } 
      }
    );
    console.log(`✅ Reset face enrollment status for ${updateResult.modifiedCount} users`);
    
    console.log('🎉 Face data cleared successfully! Ready for fresh registrations.');
    
  } catch (error) {
    console.error('❌ Error clearing face data:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

clearFaceData();