const express = require('express');
const router = express.Router();
const HostelRoom = require('../models/HostelRoom');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/hostel/rooms
// @desc    Get all hostel rooms with occupancy details
// @access  Private (Admin)
router.get('/rooms', protect, authorize('admin'), async (req, res) => {
  try {
    const { floor, type, availability } = req.query;
    
    let query = {};
    
    if (floor) query.floor = parseInt(floor);
    if (type) query.type = type;
    if (availability === 'available') query.isAvailable = true;
    if (availability === 'occupied') query.isAvailable = false;

    const rooms = await HostelRoom.find(query)
      .populate('occupants', 'name studentId email department semester phoneNumber')
      .sort({ floor: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel rooms',
      error: error.message
    });
  }
});

// @route   POST /api/hostel/rooms
// @desc    Create a new hostel room
// @access  Private (Admin)
router.post('/rooms', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomNumber, floor, capacity, type, facilities } = req.body;

    // Check if room already exists
    const existingRoom = await HostelRoom.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    const room = await HostelRoom.create({
      roomNumber,
      floor,
      capacity,
      type,
      facilities: facilities || []
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message
    });
  }
});

// @route   PUT /api/hostel/rooms/:id
// @desc    Update hostel room details
// @access  Private (Admin)
router.put('/rooms/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const updatedRoom = await HostelRoom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('occupants', 'name studentId email');

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating room',
      error: error.message
    });
  }
});

// @route   POST /api/hostel/rooms/:id/assign
// @desc    Assign student to a room
// @access  Private (Admin)
router.post('/rooms/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const room = await HostelRoom.findById(req.params.id);
    const student = await User.findById(studentId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if room has available space
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room is at full capacity'
      });
    }

    // Check if student is already assigned to a room
    const currentRoom = await HostelRoom.findOne({ occupants: studentId });
    if (currentRoom) {
      return res.status(400).json({
        success: false,
        message: `Student is already assigned to room ${currentRoom.roomNumber}`
      });
    }

    // Assign student to room
    room.occupants.push(studentId);
    room.isAvailable = room.occupants.length < room.capacity;
    await room.save();

    // Update student's room number
    student.roomNumber = room.roomNumber;
    await student.save();

    const updatedRoom = await HostelRoom.findById(req.params.id)
      .populate('occupants', 'name studentId email department');

    res.status(200).json({
      success: true,
      message: 'Student assigned to room successfully',
      data: updatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning student to room',
      error: error.message
    });
  }
});

// @route   DELETE /api/hostel/rooms/:id/remove/:studentId
// @desc    Remove student from a room
// @access  Private (Admin)
router.delete('/rooms/:id/remove/:studentId', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    const student = await User.findById(req.params.studentId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from room
    room.occupants = room.occupants.filter(
      occupant => occupant.toString() !== req.params.studentId
    );
    room.isAvailable = room.occupants.length < room.capacity;
    await room.save();

    // Clear student's room number
    student.roomNumber = null;
    await student.save();

    const updatedRoom = await HostelRoom.findById(req.params.id)
      .populate('occupants', 'name studentId email department');

    res.status(200).json({
      success: true,
      message: 'Student removed from room successfully',
      data: updatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing student from room',
      error: error.message
    });
  }
});

// @route   GET /api/hostel/overview
// @desc    Get hostel overview statistics
// @access  Private (Admin)
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalRooms = await HostelRoom.countDocuments();
    const availableRooms = await HostelRoom.countDocuments({ isAvailable: true });
    const fullyOccupiedRooms = await HostelRoom.countDocuments({ isAvailable: false });
    
    const rooms = await HostelRoom.find();
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupants.length, 0);
    
    // Get floor-wise statistics
    const floorStats = await HostelRoom.aggregate([
      {
        $group: {
          _id: '$floor',
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          occupiedBeds: { $sum: { $size: '$occupants' } },
          availableRooms: {
            $sum: { $cond: ['$isAvailable', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get room type statistics
    const typeStats = await HostelRoom.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          occupiedBeds: { $sum: { $size: '$occupants' } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRooms,
          availableRooms,
          fullyOccupiedRooms,
          totalCapacity,
          occupiedBeds,
          availableBeds: totalCapacity - occupiedBeds,
          occupancyRate: totalCapacity > 0 ? ((occupiedBeds / totalCapacity) * 100).toFixed(2) : 0
        },
        floorStats,
        typeStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel overview',
      error: error.message
    });
  }
});

// @route   GET /api/hostel/students/unassigned
// @desc    Get students not assigned to any room
// @access  Private (Admin)
router.get('/students/unassigned', protect, authorize('admin'), async (req, res) => {
  try {
    const assignedStudentIds = await HostelRoom.distinct('occupants');
    
    const unassignedStudents = await User.find({
      _id: { $nin: assignedStudentIds },
      role: 'student',
      isActive: true
    }).select('name studentId email department semester phoneNumber');

    res.status(200).json({
      success: true,
      count: unassignedStudents.length,
      data: unassignedStudents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned students',
      error: error.message
    });
  }
});

// @route   GET /api/hostel/my-room
// @desc    Get current user's room information
// @access  Private (Student)
router.get('/my-room', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the room that contains this user
    const room = await HostelRoom.findOne({ 
      occupants: userId 
    }).populate('occupants', 'name studentId email department semester phoneNumber');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any room yet. Please contact the hostel administration.'
      });
    }

    // Get user's information
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        room: {
          roomNumber: room.roomNumber,
          floor: room.floor,
          type: room.type,
          capacity: room.capacity,
          facilities: room.facilities,
          isAvailable: room.isAvailable
        },
        occupants: room.occupants,
        user: {
          name: user.name,
          studentId: user.studentId,
          roomNumber: user.roomNumber
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room information',
      error: error.message
    });
  }
});

module.exports = router;