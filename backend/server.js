const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Load environment variables
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debug log

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then((result) => {
    console.log('✅ Cloudinary Connected Successfully:', result.status);
    console.log(`🌩️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  })
  .catch((error) => {
    console.error('❌ Cloudinary Connection Error:', error.message);
    console.log('⚠️  Face enrollment will use local storage as fallback');
  });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/face', require('./routes/face'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hostel', require('./routes/hostel'));
app.use('/api/visitors', require('./routes/visitor'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/meals', require('./routes/meal'));

// Health check route for Cloudinary
app.get('/api/health/cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      status: result.status,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      message: 'Cloudinary is operational'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🎓 Smart Attendance & Hostel Management System API',
    version: '1.0.0',
    status: 'running',
    services: {
      database: 'MongoDB Connected',
      storage: 'Cloudinary Integrated',
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'
    },
    endpoints: {
      face_enrollment: '/api/face/enroll',
      face_recognition: '/api/face/recognize',
      attendance: '/api/attendance',
      auth: '/api/auth'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  
  // Handle Cloudinary specific errors
  if (err.message && err.message.includes('cloudinary')) {
    return res.status(500).json({
      success: false,
      message: 'Cloud storage error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Storage service unavailable'
    });
  }
  
  // Handle Multer specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please use "image" field for uploads.'
    });
  }
  
  // Generic error handler
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
});
