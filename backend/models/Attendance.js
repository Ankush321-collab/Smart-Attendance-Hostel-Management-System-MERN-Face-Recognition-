const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  method: {
    type: String,
    enum: ['face', 'qr', 'manual'],
    default: 'face'
  },
  location: {
    type: String,
    default: 'Main Entrance'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  imageUrl: {
    type: String
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
AttendanceSchema.index({ student: 1, date: -1 });
AttendanceSchema.index({ studentId: 1, date: -1 });
AttendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
