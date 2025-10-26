const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get all visitors (Admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status, purpose, date, search } = req.query;
    const query = {};

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'completed') {
      query.isActive = false;
    }

    // Filter by purpose
    if (purpose && purpose !== 'all') {
      query.purpose = purpose;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.checkInTime = { $gte: startDate, $lt: endDate };
    }

    // Search by name, phone, or room
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(query)
      .populate('studentToVisit', 'name email')
      .populate('approvedBy', 'name')
      .sort({ checkInTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Visitor.countDocuments(query);

    res.json({
      visitors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get visitor statistics (Admin only)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Promise.all([
      // Today's visitors
      Visitor.countDocuments({
        checkInTime: { $gte: today, $lt: tomorrow }
      }),
      // Active visitors
      Visitor.countDocuments({ isActive: true }),
      // This week's visitors
      Visitor.countDocuments({
        checkInTime: {
          $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }),
      // Average visit duration this month
      Visitor.aggregate([
        {
          $match: {
            checkOutTime: { $exists: true },
            checkInTime: {
              $gte: new Date(today.getFullYear(), today.getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: {
              $avg: {
                $divide: [
                  { $subtract: ['$checkOutTime', '$checkInTime'] },
                  1000 * 60 // Convert to minutes
                ]
              }
            }
          }
        }
      ])
    ]);

    res.json({
      todayVisitors: stats[0],
      activeVisitors: stats[1],
      weeklyVisitors: stats[2],
      avgDuration: stats[3][0]?.avgDuration || 0
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check in a visitor
router.post('/checkin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      phone,
      email,
      purpose,
      studentToVisit,
      roomNumber,
      idProof,
      idNumber,
      address,
      remarks,
      visitDuration
    } = req.body;

    // Validate required fields
    if (!name || !phone || !purpose || !idProof || !idNumber || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate student and room if visiting a student
    if ((purpose === 'Family Visit' || purpose === 'Meeting') && !studentToVisit) {
      return res.status(400).json({ message: 'Student to visit is required' });
    }

    // Check if student exists and get their room
    let validatedRoomNumber = roomNumber;
    if (studentToVisit) {
      const student = await User.findById(studentToVisit);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (student.roomNumber) {
        validatedRoomNumber = student.roomNumber;
      }
    }

    const visitor = new Visitor({
      name,
      phone,
      email,
      purpose,
      studentToVisit: studentToVisit || undefined,
      roomNumber: validatedRoomNumber,
      idProof,
      idNumber,
      address,
      approvedBy: req.user.id,
      remarks,
      visitDuration
    });

    await visitor.save();
    await visitor.populate('studentToVisit', 'name email');
    await visitor.populate('approvedBy', 'name');

    res.status(201).json(visitor);
  } catch (error) {
    console.error('Error checking in visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check out a visitor
router.put('/:id/checkout', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (!visitor.isActive) {
      return res.status(400).json({ message: 'Visitor already checked out' });
    }

    visitor.checkOutTime = new Date();
    visitor.isActive = false;
    
    if (req.body.remarks) {
      visitor.remarks = visitor.remarks ? 
        `${visitor.remarks}\nCheckout: ${req.body.remarks}` : 
        `Checkout: ${req.body.remarks}`;
    }

    await visitor.save();
    await visitor.populate('studentToVisit', 'name email');
    await visitor.populate('approvedBy', 'name');

    res.json(visitor);
  } catch (error) {
    console.error('Error checking out visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get visitor by ID
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visitor = await Visitor.findById(req.params.id)
      .populate('studentToVisit', 'name email roomNumber')
      .populate('approvedBy', 'name');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json(visitor);
  } catch (error) {
    console.error('Error fetching visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update visitor details
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('studentToVisit', 'name email')
     .populate('approvedBy', 'name');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json(visitor);
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete visitor record
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({ message: 'Visitor record deleted successfully' });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;