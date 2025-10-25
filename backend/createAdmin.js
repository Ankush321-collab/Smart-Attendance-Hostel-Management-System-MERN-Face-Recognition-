const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hostel.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log('📧 Email: admin@hostel.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@hostel.com',
      password: 'admin123',
      role: 'admin',
      studentId: null,
      department: 'Administration',
      isActive: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('📧 Email: admin@hostel.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();