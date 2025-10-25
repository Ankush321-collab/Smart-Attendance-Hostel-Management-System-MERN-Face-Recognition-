const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const HostelRoom = require('../models/HostelRoom');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    // Get total students
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

    // Get face enrolled students
    const enrolledStudents = await User.countDocuments({ 
      role: 'student', 
      isFaceEnrolled: true,
      isActive: true 
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today },
      status: 'present'
    });

    // Get total hostel capacity
    const rooms = await HostelRoom.find();
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupants.length, 0);

    // Get recent attendance (last 10)
    const recentAttendance = await Attendance.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('student', 'name studentId department');

    // Get attendance trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const attendanceTrend = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Department-wise statistics
    const departmentStats = await User.aggregate([
      {
        $match: { role: 'student', isActive: true }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          enrolled: {
            $sum: { $cond: ['$isFaceEnrolled', 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents,
          enrolledStudents,
          todayAttendance,
          attendancePercentage: totalStudents > 0 
            ? ((todayAttendance / totalStudents) * 100).toFixed(2) 
            : 0
        },
        hostel: {
          totalCapacity,
          occupiedBeds,
          availableBeds: totalCapacity - occupiedBeds,
          occupancyRate: totalCapacity > 0 
            ? ((occupiedBeds / totalCapacity) * 100).toFixed(2) 
            : 0
        },
        recentAttendance,
        attendanceTrend,
        departmentStats
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin only)
router.get('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, department, semester, enrolled, page = 1, limit = 20 } = req.query;

    let query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (semester) {
      query.semester = parseInt(semester);
    }

    if (enrolled !== undefined) {
      query.isFaceEnrolled = enrolled === 'true';
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// @route   GET /api/admin/student/:id
// @desc    Get single student details
// @access  Private (Admin only)
router.get('/student/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's attendance records
    const attendance = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        student,
        recentAttendance: attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student details',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/student/:id
// @desc    Update student information
// @access  Private (Admin only)
router.put('/student/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const allowedUpdates = [
      'name', 'email', 'studentId', 'department', 
      'semester', 'phoneNumber', 'roomNumber', 'isActive'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/student/:id
// @desc    Delete/deactivate student
// @access  Private (Admin only)
router.delete('/student/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - just deactivate
    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// @route   GET /api/admin/rooms
// @desc    Get all hostel rooms
// @access  Private (Admin only)
router.get('/rooms', protect, authorize('admin'), async (req, res) => {
  try {
    const rooms = await HostelRoom.find()
      .populate('occupants', 'name studentId email')
      .sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message
    });
  }
});

module.exports = router;
