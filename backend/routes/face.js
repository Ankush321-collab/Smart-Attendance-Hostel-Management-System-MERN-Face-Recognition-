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

    // Send image to Python AI module for encoding
    const pythonAIUrl = process.env.PYTHON_AI_URL || 'http://localhost:5001';
    const imagePath = req.file.path;
    const mockMode = process.env.MOCK_FACE_RECOGNITION === 'true';

    try {
      let encodingData;
      
      if (mockMode) {
        // Mock mode for demo purposes
        console.log('🎭 Running in mock mode - Python AI server not required');
        encodingData = {
          success: true,
          encoding: Array.from({length: 128}, () => Math.random()),
          studentId: user.studentId,
          message: 'Face encoded successfully (mock mode)',
          note: 'This is a demo encoding for testing purposes'
        };
      } else {
        // Real Python AI mode
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        console.log(`Attempting to connect to Python AI at: ${pythonAIUrl}/encode`);
        
        const response = await axios.post(`${pythonAIUrl}/encode`, {
          image: base64Image,
          studentId: user.studentId
        }, {
          timeout: 30000 // 30 second timeout
        });

        console.log('Python AI response:', response.data);
        encodingData = response.data;
      }

      if (!encodingData.success) {
        throw new Error(encodingData.message || 'Face encoding failed');
      }

      // Save encoding to database
      await FaceEncoding.findOneAndUpdate(
        { studentId: user.studentId },
        {
          student: user._id,
          studentId: user.studentId,
          encoding: encodingData.encoding,
          imagePath: imagePath,
          lastUpdated: Date.now()
        },
        { upsert: true, new: true }
      );

      // Update user face enrollment status
      user.isFaceEnrolled = true;
      user.faceEncodingPath = imagePath;
      user.profileImage = imagePath;
      await user.save();

      res.status(200).json({
        success: true,
        message: mockMode ? 'Face enrolled successfully (demo mode)' : 'Face enrolled successfully',
        data: {
          studentId: user.studentId,
          isFaceEnrolled: true,
          note: encodingData.note || null
        }
      });

    } catch (aiError) {
      // Delete uploaded file if AI processing fails
      await fs.unlink(imagePath).catch(console.error);
      
      console.error('AI Module Error Details:', {
        message: aiError.message,
        code: aiError.code,
        response: aiError.response?.data,
        status: aiError.response?.status
      });
      
      return res.status(500).json({
        success: false,
        message: 'Face encoding failed. Please ensure the image contains a clear face.',
        error: aiError.message,
        details: aiError.response?.data || 'Python AI server connection failed'
      });
    }

  } catch (error) {
    console.error('Face enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in face enrollment',
      error: error.message
    });
  }
});

// @route   POST /api/face/recognize
// @desc    Recognize face and return student info
// @access  Public (but can be protected if needed)
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const pythonAIUrl = process.env.PYTHON_AI_URL || 'http://localhost:5001';
    const imagePath = req.file.path;
    const mockMode = process.env.MOCK_FACE_RECOGNITION === 'true';

    try {
      let recognitionResult;
      
      // Get all enrolled face encodings
      const faceEncodings = await FaceEncoding.find({ isActive: true })
        .populate('student', 'name studentId department');

      if (mockMode) {
        // Mock mode for demo purposes
        console.log('🎭 Running face recognition in mock mode');
        
        if (faceEncodings.length === 0) {
          throw new Error('No enrolled students found for comparison');
        }
        
        // Demo: Return the first enrolled student with high confidence
        const recognizedEncoding = faceEncodings[0];
        recognitionResult = {
          success: true,
          studentId: recognizedEncoding.studentId,
          confidence: Math.random() * 15 + 85, // 85-100% confidence
          note: 'This is a demo recognition for testing purposes'
        };
      } else {
        // Real Python AI mode
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        const response = await axios.post(`${pythonAIUrl}/recognize`, {
          image: base64Image,
          encodings: faceEncodings.map(fe => ({
            studentId: fe.studentId,
            encoding: fe.encoding
          }))
        }, {
          timeout: 30000
        });
        
        recognitionResult = response.data;
      }

      // Clean up uploaded file
      await fs.unlink(imagePath).catch(console.error);

      if (!recognitionResult.success) {
        return res.status(404).json({
          success: false,
          message: recognitionResult.message || 'Face not recognized'
        });
      }

      // Find the recognized student
      const recognizedEncoding = faceEncodings.find(
        fe => fe.studentId === recognitionResult.studentId
      );

      if (!recognizedEncoding) {
        return res.status(404).json({
          success: false,
          message: 'Student not found in database'
        });
      }

      res.status(200).json({
        success: true,
        message: mockMode ? 'Face recognized successfully (demo mode)' : 'Face recognized successfully',
        data: {
          studentId: recognizedEncoding.studentId,
          name: recognizedEncoding.student.name,
          department: recognizedEncoding.student.department,
          confidence: recognitionResult.confidence,
          note: recognitionResult.note || null
        }
      });

    } catch (aiError) {
      // Clean up uploaded file
      await fs.unlink(imagePath).catch(console.error);
      
      console.error('AI Module Error:', aiError.message);
      return res.status(500).json({
        success: false,
        message: 'Face recognition failed',
        error: aiError.message
      });
    }

  } catch (error) {
    console.error('Face recognition error:', error);
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
