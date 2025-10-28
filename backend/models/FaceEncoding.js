const mongoose = require('mongoose');

const FaceEncodingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  encoding: {
    type: [Number],
    required: true
  },
  imagePath: {
    type: String,
    required: true // Now stores Cloudinary URL
  },
  cloudinaryPublicId: {
    type: String,
    required: false // For deletion purposes
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    spoof_score: Number,
    face_location: [Number],
    enrollment_timestamp: String,
    cloudinary_details: {
      url: String,
      public_id: String,
      resource_type: String,
      format: String,
      width: Number,
      height: Number,
      bytes: Number
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FaceEncoding', FaceEncodingSchema);
