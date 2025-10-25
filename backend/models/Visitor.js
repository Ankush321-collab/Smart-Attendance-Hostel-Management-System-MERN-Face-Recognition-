const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  purpose: {
    type: String,
    required: true,
    enum: ['Meeting', 'Delivery', 'Maintenance', 'Family Visit', 'Official', 'Other']
  },
  studentToVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.purpose === 'Family Visit' || this.purpose === 'Meeting';
    }
  },
  roomNumber: {
    type: String,
    required: function() {
      return this.purpose === 'Family Visit' || this.purpose === 'Meeting';
    }
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  idProof: {
    type: String, // Store ID proof type (Aadhar, Driving License, etc.)
    required: true
  },
  idNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who approved the visitor
  },
  remarks: {
    type: String
  },
  visitDuration: {
    type: Number // Duration in minutes
  }
}, {
  timestamps: true
});

// Virtual for visit duration calculation
visitorSchema.virtual('actualDuration').get(function() {
  if (this.checkOutTime) {
    return Math.floor((this.checkOutTime - this.checkInTime) / (1000 * 60)); // Duration in minutes
  }
  return null;
});

// Index for better query performance
visitorSchema.index({ checkInTime: -1 });
visitorSchema.index({ isActive: 1 });
visitorSchema.index({ studentToVisit: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);