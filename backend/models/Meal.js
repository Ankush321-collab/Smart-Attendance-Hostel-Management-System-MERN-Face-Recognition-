const mongoose = require('mongoose');

// Weekly Meal Plan Schema for PDF/Image uploads
const weeklyMealPlanSchema = new mongoose.Schema({
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  uploadedFile: {
    filename: String,
    originalName: String,
    filePath: String,
    fileType: {
      type: String,
      enum: ['pdf', 'image']
    },
    fileSize: Number
  },
  extractedText: String, // OCR extracted text
  isExtracted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'active', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const mealPlanSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  mealType: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    isVeg: {
      type: Boolean,
      default: true
    },
    allergens: [String], // Common allergens: nuts, dairy, gluten, etc.
    price: Number
  }],
  specialMenu: {
    type: Boolean,
    default: false
  },
  occasion: String, // Festival, birthday, etc.
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  weeklyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyMealPlan'
  },
  status: {
    type: String,
    enum: ['planned', 'prepared', 'served', 'completed'],
    default: 'planned'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Enhanced Feedback Schema with complaint management
const mealFeedbackSchema = new mongoose.Schema({
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedbackType: {
    type: String,
    enum: ['review', 'complaint'],
    default: 'review'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  taste: {
    type: Number,
    min: 1,
    max: 5
  },
  quantity: {
    type: Number,
    min: 1,
    max: 5
  },
  hygiene: {
    type: Number,
    min: 1,
    max: 5
  },
  comments: String,
  suggestions: String,
  // Complaint specific fields
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  complaintCategory: {
    type: String,
    enum: ['quality', 'hygiene', 'quantity', 'service', 'other']
  },
  resolution: String,
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'closed'],
    default: 'pending'
  },
  adminResponse: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// Compound index to prevent duplicate feedback per meal per student
mealFeedbackSchema.index({ mealPlan: 1, student: 1 }, { unique: true });

// Indexes for better query performance
weeklyMealPlanSchema.index({ weekStartDate: 1, weekEndDate: 1 });
weeklyMealPlanSchema.index({ status: 1 });
mealPlanSchema.index({ date: 1, mealType: 1 });
mealPlanSchema.index({ weeklyPlan: 1 });
mealFeedbackSchema.index({ mealPlan: 1 });
mealFeedbackSchema.index({ student: 1 });
mealFeedbackSchema.index({ feedbackType: 1, status: 1 });

module.exports = {
  WeeklyMealPlan: mongoose.model('WeeklyMealPlan', weeklyMealPlanSchema),
  MealPlan: mongoose.model('MealPlan', mealPlanSchema),
  MealFeedback: mongoose.model('MealFeedback', mealFeedbackSchema)
};