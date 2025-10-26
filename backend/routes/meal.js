const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { WeeklyMealPlan, MealPlan, MealFeedback } = require('../models/Meal');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/meal-plans';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meal-plan-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

// OCR / PDF extraction dependencies (server-side)
let pdfParse;
let createWorker;
let ocrAvailable = false;
try {
  pdfParse = require('pdf-parse');
  createWorker = require('tesseract.js').createWorker;
  ocrAvailable = true;
} catch (err) {
  // If these packages aren't installed, we won't crash the server — OCR endpoint will return an error.
  console.warn('OCR dependencies not installed (pdf-parse, tesseract.js). OCR endpoints will be unavailable.');
}

// Upload weekly meal plan (Admin only)
router.post('/weekly/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { title, weekStartDate } = req.body;

    if (!title || !weekStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and week start date are required'
      });
    }

    // Calculate week end date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Check if weekly plan already exists for this week
    const existingPlan = await WeeklyMealPlan.findOne({
      weekStartDate: { $lte: endDate },
      weekEndDate: { $gte: startDate }
    });

    if (existingPlan) {
      // Delete uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'Meal plan already exists for this week'
      });
    }

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    const weeklyPlan = new WeeklyMealPlan({
      weekStartDate: startDate,
      weekEndDate: endDate,
      title,
      uploadedFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileType,
        fileSize: req.file.size
      },
      createdBy: req.user.id
    });

    await weeklyPlan.save();

    // If extracted text is provided by client (we ran OCR before upload), store it
    if (req.body && req.body.extractedText) {
      weeklyPlan.extractedText = req.body.extractedText;
      weeklyPlan.isExtracted = true;
      weeklyPlan.status = 'pending'; // waiting for admin to process into daily plans
      await weeklyPlan.save();
    } else {
      // No extracted text yet: queue background OCR processing (mock or real)
      setTimeout(async () => {
        try {
          await processFileForExtraction(weeklyPlan._id);
        } catch (error) {
          console.error('Error processing file:', error);
        }
      }, 1000);
    }

    res.status(201).json({
      success: true,
      message: 'Weekly meal plan uploaded successfully',
      data: weeklyPlan
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    console.error('Error uploading weekly meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading meal plan',
      error: error.message
    });
  }
});

// OCR extract endpoint - accepts a single PDF or image and returns extracted text
router.post('/ocr-extract', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!ocrAvailable) {
      return res.status(501).json({ success: false, message: 'OCR functionality is not available on server. Please install pdf-parse and tesseract.js.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // If PDF, try pdf-parse first
    if (ext === '.pdf') {
      try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        extractedText = (data && data.text) ? data.text : '';
      } catch (pdfErr) {
        console.error('pdf-parse error:', pdfErr);
      }
    }

    // If no text found or input is image, run Tesseract OCR
    if (!extractedText || !extractedText.trim()) {
      const worker = createWorker();
      try {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(filePath);
        extractedText = (text || '').trim();
      } catch (ocrErr) {
        console.error('tesseract error:', ocrErr);
      } finally {
        try { await worker.terminate(); } catch (e) { /* ignore */ }
      }
    }

    res.json({ success: true, data: { extractedText } });
  } catch (error) {
    console.error('OCR extract error:', error);
    res.status(500).json({ success: false, message: 'Error extracting text' });
  }
});

// Create individual meal plan (Admin only)
router.post('/create', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, mealType, items, occasion } = req.body;

    if (!date || !mealType || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Date, mealType, and items are required'
      });
    }

    // Check if meal already exists for this date and type
    const existingMeal = await MealPlan.findOne({
      date: new Date(date),
      mealType
    });

    if (existingMeal) {
      return res.status(400).json({
        success: false,
        message: `${mealType} meal already exists for this date`
      });
    }

    // Validate meal type
    if (!['Breakfast', 'Lunch', 'Snacks', 'Dinner'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be Breakfast, Lunch, Snacks, or Dinner'
      });
    }

    const mealPlan = new MealPlan({
      date: new Date(date),
      mealType,
      items: items.map(item => ({
        name: item.name,
        description: item.description || '',
        isVeg: item.isVeg !== false, // Default to true
        allergens: item.allergens || []
      })),
      occasion,
      createdBy: req.user.id
    });

    await mealPlan.save();

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: mealPlan
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meal plan'
    });
  }
});

// Get weekly meal plans (Admin only)
router.get('/weekly', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const weeklyPlans = await WeeklyMealPlan.find(query)
      .populate('createdBy', 'name')
      .sort({ weekStartDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WeeklyMealPlan.countDocuments(query);

    res.json({
      success: true,
      data: weeklyPlans,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly plans'
    });
  }
});

// Process extracted text and create daily meal plans (Admin only)
router.post('/weekly/:id/process', protect, authorize('admin'), async (req, res) => {
  try {
    const { extractedMeals } = req.body;

    if (!extractedMeals || !Array.isArray(extractedMeals)) {
      return res.status(400).json({
        success: false,
        message: 'Extracted meals data is required'
      });
    }

    const weeklyPlan = await WeeklyMealPlan.findById(req.params.id);
    if (!weeklyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Weekly plan not found'
      });
    }

    // Create daily meal plans from extracted data
    const createdMeals = [];
    
    for (const mealData of extractedMeals) {
      const { date, mealType, items, occasion } = mealData;

      // Check if meal already exists
      const existingMeal = await MealPlan.findOne({
        date: new Date(date),
        mealType
      });

      if (!existingMeal) {
        const mealPlan = new MealPlan({
          date: new Date(date),
          mealType,
          items: items.map(item => ({
            name: item.name || item,
            description: item.description || '',
            isVeg: item.isVeg !== false, // Default to true
            allergens: item.allergens || []
          })),
          occasion,
          weeklyPlan: weeklyPlan._id,
          createdBy: req.user.id
        });

        await mealPlan.save();
        createdMeals.push(mealPlan);
      }
    }

    // Update weekly plan status
    weeklyPlan.status = 'processed';
    weeklyPlan.isExtracted = true;
    await weeklyPlan.save();

    res.json({
      success: true,
      message: `Created ${createdMeals.length} meal plans`,
      data: createdMeals
    });
  } catch (error) {
    console.error('Error processing meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing meal plans'
    });
  }
});

// Get meal plans (Students and Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { date, week, mealType, view = 'today' } = req.query;
    let query = {};

    if (date) {
      // Get meals for specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (view === 'week' || week) {
      // Get meals for current week
      const startDate = new Date();
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default: Get today's meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    if (mealType && mealType !== 'all') {
      query.mealType = mealType;
    }

    const mealPlans = await MealPlan.find(query)
      .populate('createdBy', 'name')
      .populate('weeklyPlan', 'title')
      .sort({ date: 1, mealType: 1 });

    // If user is a student, also get their feedback for these meals
    if (req.user.role === 'student') {
      const mealIds = mealPlans.map(meal => meal._id);
      const feedbacks = await MealFeedback.find({
        mealPlan: { $in: mealIds },
        student: req.user.id
      });

      const feedbackMap = {};
      feedbacks.forEach(feedback => {
        feedbackMap[feedback.mealPlan.toString()] = feedback;
      });

      const mealsWithFeedback = mealPlans.map(meal => ({
        ...meal.toObject(),
        userFeedback: feedbackMap[meal._id.toString()] || null
      }));

      return res.json({
        success: true,
        data: mealsWithFeedback
      });
    }

    res.json({
      success: true,
      data: mealPlans
    });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Submit meal feedback or complaint (Students only)
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit feedback'
      });
    }

    const {
      feedbackType = 'review',
      rating,
      taste,
      quantity,
      hygiene,
      comments,
      suggestions,
      priority = 'medium',
      complaintCategory
    } = req.body;

    // Check if meal plan exists
    const mealPlan = await MealPlan.findById(req.params.id);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Validation based on feedback type
    if (feedbackType === 'review' && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required for reviews and must be between 1 and 5'
      });
    }

    if (feedbackType === 'complaint' && !complaintCategory) {
      return res.status(400).json({
        success: false,
        message: 'Complaint category is required for complaints'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await MealFeedback.findOne({
      mealPlan: req.params.id,
      student: req.user.id
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.feedbackType = feedbackType;
      existingFeedback.rating = rating;
      existingFeedback.taste = taste;
      existingFeedback.quantity = quantity;
      existingFeedback.hygiene = hygiene;
      existingFeedback.comments = comments;
      existingFeedback.suggestions = suggestions;
      existingFeedback.priority = priority;
      existingFeedback.complaintCategory = complaintCategory;
      existingFeedback.status = feedbackType === 'complaint' ? 'pending' : 'closed';

      await existingFeedback.save();
      return res.json({
        success: true,
        data: existingFeedback
      });
    }

    // Create new feedback
    const feedback = new MealFeedback({
      mealPlan: req.params.id,
      student: req.user.id,
      feedbackType,
      rating,
      taste,
      quantity,
      hygiene,
      comments,
      suggestions,
      priority,
      complaintCategory,
      status: feedbackType === 'complaint' ? 'pending' : 'closed'
    });

    await feedback.save();
    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get complaints and feedback (Admin only)
router.get('/feedback', protect, authorize('admin'), async (req, res) => {
  try {
    const { type = 'all', status = 'all', priority, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type !== 'all') {
      query.feedbackType = type;
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const feedback = await MealFeedback.find(query)
      .populate('student', 'name email studentId roomNumber')
      .populate('mealPlan', 'date mealType items')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MealFeedback.countDocuments(query);

    // Get statistics
    const stats = await MealFeedback.aggregate([
      {
        $group: {
          _id: '$feedbackType',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: feedback,
      stats,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update complaint status (Admin only)
router.put('/feedback/:id/resolve', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminResponse, resolution } = req.body;

    const feedback = await MealFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.status = status || 'resolved';
    feedback.adminResponse = adminResponse;
    feedback.resolution = resolution;
    feedback.resolvedBy = req.user.id;
    feedback.resolvedAt = new Date();

    await feedback.save();
    await feedback.populate(['student', 'mealPlan', 'resolvedBy']);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error resolving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update meal plan status (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['planned', 'prepared', 'served', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const mealPlan = await MealPlan.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('createdBy', 'name');

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Error updating meal status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get meal statistics (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayMeals,
      monthlyMeals,
      avgRatings,
      totalFeedback,
      pendingComplaints,
      weeklyPlans
    ] = await Promise.all([
      // Today's meals
      MealPlan.countDocuments({
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      }),
      // This month's meals
      MealPlan.countDocuments({
        date: { $gte: thisMonth }
      }),
      // Average ratings this month
      MealFeedback.aggregate([
        {
          $lookup: {
            from: 'mealplans',
            localField: 'mealPlan',
            foreignField: '_id',
            as: 'meal'
          }
        },
        {
          $match: {
            'meal.date': { $gte: thisMonth },
            feedbackType: 'review'
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgTaste: { $avg: '$taste' },
            avgQuantity: { $avg: '$quantity' },
            avgHygiene: { $avg: '$hygiene' }
          }
        }
      ]),
      // Total feedback count this month
      MealFeedback.countDocuments({
        createdAt: { $gte: thisMonth }
      }),
      // Pending complaints
      MealFeedback.countDocuments({
        feedbackType: 'complaint',
        status: 'pending'
      }),
      // Weekly plans
      WeeklyMealPlan.countDocuments({
        weekStartDate: { $gte: thisMonth }
      })
    ]);

    res.json({
      success: true,
      data: {
        todayMeals,
        monthlyMeals,
        avgRatings: avgRatings[0] || { avgRating: 0, avgTaste: 0, avgQuantity: 0, avgHygiene: 0 },
        totalFeedback,
        pendingComplaints,
        weeklyPlans
      }
    });
  } catch (error) {
    console.error('Error fetching meal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mock OCR processing function
async function processFileForExtraction(weeklyPlanId) {
  try {
    const weeklyPlan = await WeeklyMealPlan.findById(weeklyPlanId);
    if (!weeklyPlan) return;

    // Simulate OCR processing
    const mockExtractedText = `
    Monday:
    Breakfast: Poha, Tea, Banana
    Lunch: Rice, Dal, Sabji, Roti
    Snacks: Samosa, Chutney
    Dinner: Rice, Rajma, Roti
    
    Tuesday:
    Breakfast: Upma, Coffee, Orange
    Lunch: Rice, Sambar, Sabji, Roti
    Snacks: Biscuits, Tea
    Dinner: Rice, Chole, Roti
    `;

    weeklyPlan.extractedText = mockExtractedText;
    weeklyPlan.isExtracted = true;
    weeklyPlan.status = 'processed';
    
    await weeklyPlan.save();
  } catch (error) {
    console.error('Error in OCR processing:', error);
  }
}

module.exports = router;