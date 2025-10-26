const mongoose = require('mongoose');
const Visitor = require('./models/Visitor');
const Maintenance = require('./models/Maintenance');
const { MealPlan, MealFeedback } = require('./models/Meal');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin and student users
    const admin = await User.findOne({ role: 'admin' });
    const students = await User.find({ role: 'student' }).limit(3);

    if (!admin) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing test data
    await Visitor.deleteMany({});
    await Maintenance.deleteMany({});
    await MealPlan.deleteMany({});
    await MealFeedback.deleteMany({});
    console.log('Cleared existing test data');

    // Seed Visitors
    const visitors = [
      {
        name: 'John Smith',
        phone: '9876543210',
        email: 'john@example.com',
        purpose: 'Family Visit',
        studentToVisit: students[0]?._id,
        roomNumber: '101',
        idProof: 'Aadhar Card',
        idNumber: '1234-5678-9012',
        address: '123 Main Street, City',
        approvedBy: admin._id,
        isActive: true,
        checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        name: 'Sarah Johnson',
        phone: '9876543211',
        email: 'sarah@example.com',
        purpose: 'Delivery',
        roomNumber: '102',
        idProof: 'Driving License',
        idNumber: 'DL1234567890',
        address: '456 Oak Avenue, City',
        approvedBy: admin._id,
        isActive: false,
        checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        checkOutTime: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        name: 'Mike Wilson',
        phone: '9876543212',
        email: 'mike@example.com',
        purpose: 'Maintenance',
        roomNumber: '201',
        idProof: 'Passport',
        idNumber: 'P1234567',
        address: '789 Pine Street, City',
        approvedBy: admin._id,
        isActive: true,
        checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ];

    await Visitor.insertMany(visitors);
    console.log('Seeded visitors data');

    // Seed Maintenance Requests
    const maintenanceRequests = [
      {
        title: 'AC Not Working',
        description: 'The air conditioning unit in my room is not cooling properly. It makes strange noises and warm air comes out.',
        category: 'AC/Heating',
        priority: 'High',
        reportedBy: students[0]?._id || admin._id,
        roomNumber: '101',
        floor: 1,
        status: 'Pending',
        studentRemarks: 'The issue started 2 days ago'
      },
      {
        title: 'Broken Light Fixture',
        description: 'The ceiling light in the study area is flickering and sometimes goes off completely.',
        category: 'Electrical',
        priority: 'Medium',
        reportedBy: students[1]?._id || admin._id,
        roomNumber: '102',
        floor: 1,
        status: 'In Progress',
        assignedTo: 'Electrician Team',
        assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        estimatedCost: 500
      },
      {
        title: 'Leaking Tap',
        description: 'The bathroom tap keeps dripping even when turned off tightly. Water wastage is concerning.',
        category: 'Plumbing',
        priority: 'Low',
        reportedBy: students[2]?._id || admin._id,
        roomNumber: '201',
        floor: 2,
        status: 'Completed',
        assignedTo: 'Plumber John',
        assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        actualCost: 200,
        resolutionDetails: 'Replaced the tap washer and tightened the valve. Issue resolved.'
      },
      {
        title: 'Internet Connection Issues',
        description: 'WiFi connection is very slow and frequently disconnects in the evening hours.',
        category: 'Internet',
        priority: 'Emergency',
        reportedBy: students[0]?._id || admin._id,
        roomNumber: '301',
        floor: 3,
        status: 'Pending'
      }
    ];

    await Maintenance.insertMany(maintenanceRequests);
    console.log('Seeded maintenance requests data');

    // Seed Meal Plans
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const mealPlans = [
      // Today's meals
      {
        date: today,
        mealType: 'Breakfast',
        items: [
          { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil curry', isVeg: true },
          { name: 'Coconut Chutney', description: 'Fresh coconut chutney', isVeg: true },
          { name: 'Filter Coffee', description: 'South Indian filter coffee', isVeg: true }
        ],
        specialMenu: false,
        estimatedCost: 50,
        createdBy: admin._id
      },
      {
        date: today,
        mealType: 'Lunch',
        items: [
          { name: 'Chicken Biryani', description: 'Aromatic basmati rice with spiced chicken', isVeg: false },
          { name: 'Veg Biryani', description: 'Aromatic basmati rice with mixed vegetables', isVeg: true },
          { name: 'Raita', description: 'Yogurt with cucumber and spices', isVeg: true },
          { name: 'Pickle', description: 'Mixed vegetable pickle', isVeg: true }
        ],
        specialMenu: false,
        estimatedCost: 120,
        createdBy: admin._id
      },
      {
        date: today,
        mealType: 'Dinner',
        items: [
          { name: 'Chapati', description: 'Fresh wheat flatbread', isVeg: true },
          { name: 'Dal Tadka', description: 'Yellow lentils with tempering', isVeg: true },
          { name: 'Mixed Vegetable Curry', description: 'Seasonal vegetables in curry', isVeg: true },
          { name: 'Rice', description: 'Steamed basmati rice', isVeg: true }
        ],
        specialMenu: false,
        estimatedCost: 80,
        createdBy: admin._id
      },
      // Tomorrow's meals
      {
        date: tomorrow,
        mealType: 'Breakfast',
        items: [
          { name: 'Aloo Paratha', description: 'Potato stuffed flatbread', isVeg: true },
          { name: 'Curd', description: 'Fresh yogurt', isVeg: true },
          { name: 'Pickle', description: 'Mango pickle', isVeg: true },
          { name: 'Masala Tea', description: 'Spiced Indian tea', isVeg: true }
        ],
        specialMenu: false,
        estimatedCost: 60,
        createdBy: admin._id
      },
      {
        date: tomorrow,
        mealType: 'Lunch',
        items: [
          { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', isVeg: true },
          { name: 'Jeera Rice', description: 'Cumin flavored rice', isVeg: true },
          { name: 'Naan', description: 'Leavened flatbread', isVeg: true },
          { name: 'Salad', description: 'Fresh green salad', isVeg: true }
        ],
        specialMenu: false,
        estimatedCost: 100,
        createdBy: admin._id
      },
      // Special meal for day after tomorrow
      {
        date: dayAfterTomorrow,
        mealType: 'Lunch',
        items: [
          { name: 'Mutton Curry', description: 'Spicy goat meat curry', isVeg: false },
          { name: 'Rajma Curry', description: 'Red kidney beans curry', isVeg: true },
          { name: 'Basmati Rice', description: 'Aromatic long grain rice', isVeg: true },
          { name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', isVeg: true }
        ],
        specialMenu: true,
        occasion: 'Weekend Special',
        estimatedCost: 150,
        createdBy: admin._id
      }
    ];

    const createdMealPlans = await MealPlan.insertMany(mealPlans);
    console.log('Seeded meal plans data');

    // Seed some meal feedback from students
    if (students.length > 0) {
      const feedbacks = [
        {
          mealPlan: createdMealPlans[0]._id, // Today's breakfast
          student: students[0]._id,
          rating: 4,
          taste: 4,
          quantity: 5,
          hygiene: 4,
          comments: 'Great breakfast! Idli was soft and sambar was tasty.',
          suggestions: 'Could add more variety in chutneys.'
        },
        {
          mealPlan: createdMealPlans[1]._id, // Today's lunch
          student: students[1]._id,
          rating: 5,
          taste: 5,
          quantity: 4,
          hygiene: 5,
          comments: 'Excellent biryani! Best meal this week.',
          suggestions: 'Perfect as it is!'
        },
        {
          mealPlan: createdMealPlans[0]._id, // Today's breakfast
          student: students[2]._id,
          rating: 3,
          taste: 3,
          quantity: 4,
          hygiene: 4,
          comments: 'Average breakfast. Coffee was good.',
          suggestions: 'Sambar could be more flavorful.'
        }
      ];

      await MealFeedback.insertMany(feedbacks);
      console.log('Seeded meal feedback data');
    }

    console.log('Sample data seeded successfully!');
    console.log('\nSample Data Summary:');
    console.log('- 3 Visitors (2 active, 1 checked out)');
    console.log('- 4 Maintenance requests (1 pending, 1 in progress, 1 completed, 1 emergency)');
    console.log('- 6 Meal plans (today, tomorrow, and special meal)');
    console.log('- 3 Meal feedback entries');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData();