// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for face images
const faceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel-attendance/faces', // Organize in folders
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 512, height: 512, crop: 'fill' }, // Standardize face image size
      { quality: 'auto:good' }, // Automatic quality optimization
      { format: 'jpg' } // Convert to JPG for consistency
    ],
    public_id: (req, file) => {
      // Generate unique filename (student ID will be added later in the route)
      return `face-upload-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    }
  },
});

const faceUpload = multer({ 
  storage: faceStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

module.exports = {
  cloudinary,
  faceUpload
};