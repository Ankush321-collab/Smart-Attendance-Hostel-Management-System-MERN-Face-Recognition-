const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get all maintenance requests
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category, room, search } = req.query;
    const query = {};

    // Filter by user role
    if (req.user.role === 'student') {
      query.reportedBy = req.user.id;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by room
    if (room) {
      query.roomNumber = { $regex: room, $options: 'i' };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { assignedTo: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await Maintenance.find(query)
      .populate('reportedBy', 'name email roomNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Maintenance.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get maintenance statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total requests
      Maintenance.countDocuments(),
      // Pending requests
      Maintenance.countDocuments({ status: 'Pending' }),
      // In progress requests
      Maintenance.countDocuments({ status: 'In Progress' }),
      // Completed requests
      Maintenance.countDocuments({ status: 'Completed' }),
      // Emergency requests
      Maintenance.countDocuments({ priority: 'Emergency', status: { $ne: 'Completed' } }),
      // Average resolution time
      Maintenance.aggregate([
        {
          $match: { status: 'Completed', completedDate: { $exists: true } }
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: {
              $avg: {
                $divide: [
                  { $subtract: ['$completedDate', '$createdAt'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          }
        }
      ])
    ]);

    // Category-wise breakdown
    const categoryStats = await Maintenance.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      total: stats[0],
      pending: stats[1],
      inProgress: stats[2],
      completed: stats[3],
      emergency: stats[4],
      avgResolutionTime: stats[5][0]?.avgResolutionTime || 0,
      categoryBreakdown: categoryStats
    });
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new maintenance request
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      roomNumber,
      floor,
      images,
      studentRemarks
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !roomNumber || !floor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // For students, use their room number if not provided
    let finalRoomNumber = roomNumber;
    if (req.user.role === 'student' && req.user.roomNumber) {
      finalRoomNumber = req.user.roomNumber;
    }

    const maintenanceRequest = new Maintenance({
      title,
      description,
      category,
      priority: priority || 'Medium',
      reportedBy: req.user.id,
      roomNumber: finalRoomNumber,
      floor,
      images: images || [],
      studentRemarks
    });

    await maintenanceRequest.save();
    await maintenanceRequest.populate('reportedBy', 'name email roomNumber');

    res.status(201).json(maintenanceRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update maintenance request (Admin only for status updates)
router.put('/:id', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Students can only update their own requests and only certain fields
    if (req.user.role === 'student') {
      if (request.reportedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Students can only update description and student remarks
      const allowedUpdates = ['description', 'studentRemarks'];
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const updatedRequest = await Maintenance.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('reportedBy', 'name email roomNumber');

      return res.json(updatedRequest);
    }

    // Admin can update all fields
    const updates = { ...req.body };
    
    // Set completion date if status is being changed to completed
    if (updates.status === 'Completed' && request.status !== 'Completed') {
      updates.completedDate = new Date();
    }

    // Set assigned date if assignedTo is being set
    if (updates.assignedTo && !request.assignedTo) {
      updates.assignedDate = new Date();
    }

    const updatedRequest = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email roomNumber');

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get maintenance request by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id)
      .populate('reportedBy', 'name email roomNumber');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Students can only view their own requests
    if (req.user.role === 'student' && request.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete maintenance request
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Students can only delete their own pending requests
    if (req.user.role === 'student') {
      if (request.reportedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (request.status !== 'Pending') {
        return res.status(400).json({ message: 'Cannot delete request that is in progress or completed' });
      }
    }

    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;