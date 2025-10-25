const mongoose = require('mongoose');

const HostelRoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  floor: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 2
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad'],
    default: 'double'
  },
  facilities: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for available beds
HostelRoomSchema.virtual('availableBeds').get(function() {
  return this.capacity - this.occupants.length;
});

module.exports = mongoose.model('HostelRoom', HostelRoomSchema);
