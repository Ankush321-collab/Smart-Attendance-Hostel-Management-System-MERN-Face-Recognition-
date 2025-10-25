const mongoose = require('mongoose');
const HostelRoom = require('./models/HostelRoom');
require('dotenv').config();

const seedRooms = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if rooms already exist
    const existingRooms = await HostelRoom.countDocuments();
    if (existingRooms > 0) {
      console.log('⚠️ Hostel rooms already exist');
      process.exit(0);
    }

    // Create sample rooms
    const rooms = [];
    
    // Floor 1 - Ground Floor
    for (let i = 101; i <= 110; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 1,
        capacity: 2,
        type: 'double',
        facilities: ['Wi-Fi', 'Study Table', 'Wardrobe', 'Fan'],
        isAvailable: true,
        occupants: []
      });
    }

    // Floor 2
    for (let i = 201; i <= 210; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 2,
        capacity: i % 2 === 0 ? 3 : 2, // Mix of double and triple rooms
        type: i % 2 === 0 ? 'triple' : 'double',
        facilities: ['Wi-Fi', 'Study Table', 'Wardrobe', 'Fan', 'AC'],
        isAvailable: true,
        occupants: []
      });
    }

    // Floor 3
    for (let i = 301; i <= 308; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 3,
        capacity: 1,
        type: 'single',
        facilities: ['Wi-Fi', 'Study Table', 'Wardrobe', 'Fan', 'AC', 'Attached Bathroom'],
        isAvailable: true,
        occupants: []
      });
    }

    // Create all rooms
    await HostelRoom.insertMany(rooms);

    console.log('✅ Sample hostel rooms created successfully!');
    console.log(`📊 Total rooms created: ${rooms.length}`);
    console.log('');
    console.log('🏢 Room Distribution:');
    console.log('📍 Floor 1: 10 double rooms (101-110)');
    console.log('📍 Floor 2: 10 mixed rooms (201-210) - double & triple');
    console.log('📍 Floor 3: 8 single rooms (301-308)');
    console.log('');
    console.log('🌐 You can manage rooms at: http://localhost:3000/admin/hostel');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating hostel rooms:', error.message);
    process.exit(1);
  }
};

seedRooms();