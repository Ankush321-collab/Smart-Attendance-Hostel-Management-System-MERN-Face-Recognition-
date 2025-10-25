const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electrical', 'Plumbing', 'Furniture', 'AC/Heating', 'Internet', 'Security', 'Cleaning', 'Other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  assignedTo: {
    type: String, // Maintenance staff name
    trim: true
  },
  assignedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  images: [{
    type: String // Store image URLs/paths
  }],
  adminRemarks: {
    type: String
  },
  studentRemarks: {
    type: String
  },
  resolutionDetails: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for days pending
maintenanceSchema.virtual('daysPending').get(function() {
  if (this.status === 'Completed') {
    return Math.floor((this.completedDate - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Index for better query performance
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ priority: 1 });
maintenanceSchema.index({ reportedBy: 1 });
maintenanceSchema.index({ roomNumber: 1 });
maintenanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);