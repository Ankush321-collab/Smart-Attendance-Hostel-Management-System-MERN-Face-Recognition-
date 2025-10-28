const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const FaceEncoding = require('../models/FaceEncoding');
const { protect } = require('../middleware/auth');
const { cloudinary, faceUpload } = require('../config/cloudinary');

// @route   POST /api/face/enroll
// @desc    Enroll face for a student using Cloudinary
// @access  Private
router.post('/enroll', protect, faceUpload.single('image'), async (req, res) => {
  console.log('🎯 Face enrollment route hit');
  console.log('User:', req.user?.studentId);
  console.log('File received:', !!req.file);
  
  try {
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    console.log('📁 File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    });

    const user = await User.findById(req.user.id);
    console.log('👤 User found:', user?.studentId);
    
    if (!user.studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for face enrollment'
      });
    }

    // Get Cloudinary image details
    const cloudinaryResult = req.file;
    const imageUrl = cloudinaryResult.path; // Cloudinary URL
    const publicId = cloudinaryResult.filename; // Cloudinary public ID

    console.log('📷 Image uploaded to Cloudinary:', {
      url: imageUrl,
      publicId: publicId,
      studentId: user.studentId
    });

    // Send image to Python Face Recognition Server for encoding
    const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
    const mockMode = process.env.MOCK_FACE_RECOGNITION === 'true';

    try {
      let encodingData;
      
      if (mockMode) {
        // Mock mode for demo purposes
        console.log('🎭 Running in mock mode - Python server not required');
        encodingData = {
          success: true,
          encoding: Array.from({length: 128}, () => Math.random()),
          studentId: user.studentId,
          message: 'Face encoded successfully (mock mode)',
          note: 'This is a demo encoding for testing purposes'
        };
      } else {
        // Real Python Face Recognition mode using Cloudinary URL
        console.log(`🔗 Connecting to Python Face Recognition Server at: ${pythonServerUrl}/encode`);
        
        const response = await axios.post(`${pythonServerUrl}/encode`, {
          image_url: imageUrl, // Send Cloudinary URL instead of base64
          studentId: user.studentId
        }, {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Python Face Recognition Server response:', {
          success: response.data.success,
          message: response.data.message,
          studentId: response.data.studentId,
          spoof_score: response.data.spoof_score
        });
        
        encodingData = response.data;
      }

      if (!encodingData.success) {
        // Delete from Cloudinary if encoding fails
        await cloudinary.uploader.destroy(publicId);
        throw new Error(encodingData.message || 'Face encoding failed');
      }

      // Save encoding to database with Cloudinary details
      const savedEncoding = await FaceEncoding.findOneAndUpdate(
        { studentId: user.studentId },
        {
          student: user._id,
          studentId: user.studentId,
          encoding: encodingData.encoding,
          imagePath: imageUrl, // Store Cloudinary URL
          cloudinaryPublicId: publicId, // Store for deletion if needed
          isActive: true,
          enrollmentDate: new Date(),
          lastUpdated: Date.now(),
          metadata: {
            spoof_score: encodingData.spoof_score,
            face_location: encodingData.face_location,
            enrollment_timestamp: encodingData.timestamp,
            cloudinary_details: {
              url: imageUrl,
              public_id: publicId,
              resource_type: cloudinaryResult.resource_type,
              format: cloudinaryResult.format,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              bytes: cloudinaryResult.bytes
            }
          }
        },
        { upsert: true, new: true }
      );

      // Update user face enrollment status
      user.isFaceEnrolled = true;
      user.faceEncodingPath = imageUrl;
      user.profileImage = imageUrl;
      user.cloudinaryPublicId = publicId;
      await user.save();

      console.log(`✅ Face enrollment completed for student: ${user.studentId}`);

      res.status(200).json({
        success: true,
        message: mockMode ? 'Face enrolled successfully (demo mode)' : 'Face enrolled successfully',
        data: {
          studentId: user.studentId,
          isFaceEnrolled: true,
          enrollmentId: savedEncoding._id,
          imageUrl: imageUrl,
          spoof_score: encodingData.spoof_score,
          note: encodingData.note || null
        }
      });

    } catch (aiError) {
      // Delete uploaded image from Cloudinary if AI processing fails
      await cloudinary.uploader.destroy(publicId).catch(console.error);
      
      console.error('❌ Python Face Recognition Server Error:', {
        message: aiError.message,
        code: aiError.code,
        response: aiError.response?.data,
        status: aiError.response?.status,
        url: `${pythonServerUrl}/encode`
      });
      
      // Provide specific error messages based on the response
      let errorMessage = 'Face encoding failed. Please try again.';
      if (aiError.response?.data?.message) {
        errorMessage = aiError.response.data.message;
      } else if (aiError.code === 'ECONNREFUSED') {
        errorMessage = 'Face Recognition Server is not running. Please contact administrator.';
      } else if (aiError.code === 'ETIMEDOUT') {
        errorMessage = 'Face recognition server timeout. Please try again.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: aiError.message,
        details: aiError.response?.data || 'Python Face Recognition Server connection failed'
      });
    }

  } catch (error) {
    console.error('❌ Face enrollment error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error in face enrollment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/face/recognize
// @desc    Recognize face and return student info using Cloudinary
// @access  Private
router.post('/recognize', protect, faceUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Get Cloudinary image details
    const cloudinaryResult = req.file;
    const imageUrl = cloudinaryResult.path; // Cloudinary URL
    const publicId = cloudinaryResult.filename; // Cloudinary public ID

    const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
    const mockMode = process.env.MOCK_FACE_RECOGNITION === 'true';

    try {
      let recognitionResult;
      
      // Get all enrolled face encodings
      const faceEncodings = await FaceEncoding.find({ isActive: true })
        .populate('student', 'name studentId department email');

      if (faceEncodings.length === 0) {
        // Clean up uploaded file from Cloudinary
        await cloudinary.uploader.destroy(publicId).catch(console.error);
        return res.status(400).json({
          success: false,
          message: 'No enrolled students found. Please enroll faces first.'
        });
      }

      console.log(`🔍 Processing face recognition against ${faceEncodings.length} enrolled students`);

      if (mockMode) {
        // Mock mode for demo purposes
        console.log('🎭 Running face recognition in mock mode');
        
        // SECURITY FIX: In mock mode, return the current logged-in user if they are enrolled
        const currentUser = await User.findById(req.user.id);
        const currentUserEncoding = faceEncodings.find(fe => fe.studentId === currentUser.studentId);
        
        if (currentUserEncoding) {
          // Return the current user's data
          recognitionResult = {
            success: true,
            studentId: currentUserEncoding.studentId,
            confidence: Math.random() * 15 + 85, // 85-100% confidence
            message: 'Face recognized successfully (mock mode)',
            spoof_score: 1
          };
        } else {
          throw new Error('Current user is not enrolled for face recognition');
        }
      } else {
        // Real Python Face Recognition mode using Cloudinary URL
        console.log(`🔗 Connecting to Python Face Recognition Server at: ${pythonServerUrl}/recognize`);

        const response = await axios.post(`${pythonServerUrl}/recognize`, {
          image_url: imageUrl, // Send Cloudinary URL instead of base64
          encodings: faceEncodings.map(fe => ({
            studentId: fe.studentId,
            encoding: fe.encoding
          }))
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Python Face Recognition Server response:', {
          success: response.data.success,
          message: response.data.message,
          studentId: response.data.studentId,
          confidence: response.data.confidence,
          spoof_score: response.data.spoof_score
        });
        
        recognitionResult = response.data;
      }

      // Clean up uploaded file from Cloudinary
      await cloudinary.uploader.destroy(publicId).catch(console.error);

      if (!recognitionResult.success) {
        return res.status(404).json({
          success: false,
          message: recognitionResult.message || 'Face not recognized',
          details: {
            spoof_score: recognitionResult.spoof_score,
            best_confidence: recognitionResult.best_confidence
          }
        });
      }

      // Find the recognized student
      const recognizedEncoding = faceEncodings.find(
        fe => fe.studentId === recognitionResult.studentId
      );

      if (!recognizedEncoding) {
        return res.status(404).json({
          success: false,
          message: 'Recognized student not found in database'
        });
      }

      // Log successful recognition
      console.log(`✅ Face recognized: ${recognizedEncoding.student.name} (${recognitionResult.studentId}) with ${recognitionResult.confidence}% confidence`);

      res.status(200).json({
        success: true,
        message: mockMode ? 'Face recognized successfully (demo mode)' : 'Face recognized successfully',
        data: {
          studentId: recognizedEncoding.studentId,
          name: recognizedEncoding.student.name,
          department: recognizedEncoding.student.department,
          email: recognizedEncoding.student.email,
          confidence: recognitionResult.confidence,
          distance: recognitionResult.distance,
          spoof_score: recognitionResult.spoof_score,
          timestamp: recognitionResult.timestamp,
          note: recognitionResult.note || null
        }
      });

    } catch (aiError) {
      // Clean up uploaded file from Cloudinary
      await cloudinary.uploader.destroy(publicId).catch(console.error);
      
      console.error('❌ Python Face Recognition Server Error:', {
        message: aiError.message,
        code: aiError.code,
        response: aiError.response?.data,
        status: aiError.response?.status,
        url: `${pythonServerUrl}/recognize`
      });

      // Provide specific error messages based on the response
      let errorMessage = 'Face recognition failed. Please try again.';
      if (aiError.response?.data?.message) {
        errorMessage = aiError.response.data.message;
      } else if (aiError.code === 'ECONNREFUSED') {
        errorMessage = 'Face Recognition Server is not running. Please contact administrator.';
      } else if (aiError.code === 'ETIMEDOUT') {
        errorMessage = 'Face recognition server timeout. Please try again.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: aiError.message,
        details: aiError.response?.data || 'Python Face Recognition Server connection failed'
      });
    }

  } catch (error) {
    console.error('❌ Face recognition error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in face recognition',
      error: error.message
    });
  }
});

// @route   GET /api/face/status
// @desc    Check if user has enrolled face
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const faceEncoding = await FaceEncoding.findOne({ 
      student: user._id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        isFaceEnrolled: user.isFaceEnrolled,
        hasEncoding: !!faceEncoding,
        enrollmentDate: faceEncoding?.enrollmentDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking face enrollment status',
      error: error.message
    });
  }
});

module.exports = router;
