const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const User = require('../models/User');
const FaceEncoding = require('../models/FaceEncoding');
const { protect } = require('../middleware/auth');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/faces';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

// @route   POST /api/face/enroll
// @desc    Enroll face for a student
// @access  Private
router.post('/enroll', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for face enrollment'
      });
    }

    // Send image to Python Face Recognition Server for encoding
    const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
    const imagePath = req.file.path;
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
        // Real Python Face Recognition mode
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`🔗 Connecting to Python Face Recognition Server at: ${pythonServerUrl}/encode`);
        
        const response = await axios.post(`${pythonServerUrl}/encode`, {
          image: base64Image,
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
        throw new Error(encodingData.message || 'Face encoding failed');
      }

      // Save encoding to database
      const savedEncoding = await FaceEncoding.findOneAndUpdate(
        { studentId: user.studentId },
        {
          student: user._id,
          studentId: user.studentId,
          encoding: encodingData.encoding,
          imagePath: imagePath,
          isActive: true,
          enrollmentDate: new Date(),
          lastUpdated: Date.now(),
          metadata: {
            spoof_score: encodingData.spoof_score,
            face_location: encodingData.face_location,
            enrollment_timestamp: encodingData.timestamp
          }
        },
        { upsert: true, new: true }
      );

      // Update user face enrollment status
      user.isFaceEnrolled = true;
      user.faceEncodingPath = imagePath;
      user.profileImage = imagePath;
      await user.save();

      console.log(`✅ Face enrollment completed for student: ${user.studentId}`);

      res.status(200).json({
        success: true,
        message: mockMode ? 'Face enrolled successfully (demo mode)' : 'Face enrolled successfully',
        data: {
          studentId: user.studentId,
          isFaceEnrolled: true,
          enrollmentId: savedEncoding._id,
          spoof_score: encodingData.spoof_score,
          note: encodingData.note || null
        }
      });

    } catch (aiError) {
      // Delete uploaded file if AI processing fails
      await fs.unlink(imagePath).catch(console.error);
      
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
    res.status(500).json({
      success: false,
      message: 'Error in face enrollment',
      error: error.message
    });
  }
});

// @route   POST /api/face/recognize
// @desc    Recognize face and return student info
// @access  Private
router.post('/recognize', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const pythonServerUrl = process.env.PYTHON_FACE_SERVER_URL || 'http://localhost:8085';
    const imagePath = req.file.path;
    const mockMode = process.env.MOCK_FACE_RECOGNITION === 'true';

    try {
      let recognitionResult;
      
      // Get all enrolled face encodings
      const faceEncodings = await FaceEncoding.find({ isActive: true })
        .populate('student', 'name studentId department email');

      if (faceEncodings.length === 0) {
        // Clean up uploaded file
        await fs.unlink(imagePath).catch(console.error);
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
        // Real Python Face Recognition mode
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        console.log(`🔗 Connecting to Python Face Recognition Server at: ${pythonServerUrl}/recognize`);

        const response = await axios.post(`${pythonServerUrl}/recognize`, {
          image: base64Image,
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

      // Clean up uploaded file
      await fs.unlink(imagePath).catch(console.error);

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
      // Clean up uploaded file
      await fs.unlink(imagePath).catch(console.error);
      
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
