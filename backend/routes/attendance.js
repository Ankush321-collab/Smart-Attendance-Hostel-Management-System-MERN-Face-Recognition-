const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { Parser } = require('json2csv');

// @route   POST /api/attendance/mark
// @desc    Mark attendance (face recognition)
// @access  Private
router.post('/mark', protect, async (req, res) => {
  try {
    const { studentId, method, confidence, imageUrl, location } = req.body;

    // SECURITY FIX: Ensure only students can mark their own attendance
    const currentUser = await User.findById(req.user.id);
    
    // Find the student to mark attendance for
    const student = await User.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // CRITICAL SECURITY CHECK: Only allow self-attendance marking
    if (currentUser.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only mark your own attendance',
        details: `Logged in as: ${currentUser.studentId}, Attempting to mark for: ${studentId}`
      });
    }

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      student: student._id,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today',
        data: existingAttendance
      });
    }

    // Get current time
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Create attendance record
    const attendance = await Attendance.create({
      student: student._id,
      studentId: student.studentId,
      studentName: student.name,
      date: new Date(),
      time: currentTime,
      status: 'present',
      method: method || 'face',
      confidence,
      imageUrl,
      location: location || 'Main Entrance',
      markedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance
// @desc    Get all attendance records (with filters)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, studentId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build query
    let query = {};

    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const attendance = await Attendance.find(query)
      .populate('student', 'name email studentId department')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance records for a specific student
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const attendance = await Attendance.find({ 
      studentId: req.params.studentId 
    }).sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: attendance,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/my
// @desc    Get current user's attendance
// @access  Private (Student)
router.get('/my', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.studentId) {
      return res.status(400).json({
        success: false,
        message: 'No student ID associated with this account'
      });
    }

    const attendance = await Attendance.find({ 
      studentId: user.studentId 
    }).sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: attendance,
      statistics: {
        totalDays,
        presentDays,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/export
// @desc    Export attendance data as CSV
// @access  Private (Admin)
router.get('/export', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email studentId department')
      .sort({ date: -1 });

    // Format data for CSV
    const csvData = attendance.map(record => ({
      'Student ID': record.studentId,
      'Student Name': record.studentName,
      'Department': record.student?.department || 'N/A',
      'Date': new Date(record.date).toLocaleDateString(),
      'Time': record.time,
      'Status': record.status,
      'Method': record.method,
      'Confidence': record.confidence ? `${record.confidence}%` : 'N/A',
      'Location': record.location
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance data',
      error: error.message
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
});

module.exports = router;
