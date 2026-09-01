const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const Worker = require('./models/Worker');
const Attendance = require('./models/Attendance');

const workersData = [
  { name: 'G Balaji', title: 'G Balaji' },
  { name: 'Suman', title: 'Suman' },
  { name: 'Ramjee', title: 'Ramjee' },
  { name: 'Prabhakar', title: 'Prabhakar' },
  { name: 'Watchman Balaji', title: 'Watchman Balaji' },
  { name: 'Maid Vijaya', title: 'Maid Vijaya' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing collections.');

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('password123', salt);
    
    await User.create({
      name: 'Administrator',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });
    console.log('Admin user created (admin / password123)');

    // Create Workers and their login accounts
    for (const data of workersData) {
      const worker = await Worker.create({ name: data.name, title: data.title });
      
      const workerUsername = data.name.toLowerCase().replace(/\s+/g, ''); // e.g., 'gbalaji'
      const workerPasswordHash = await bcrypt.hash('password123', salt);

      await User.create({
        name: data.name,
        username: workerUsername,
        passwordHash: workerPasswordHash,
        role: 'worker',
        workerId: worker._id
      });
      console.log(`Created worker and user account for: ${data.name} (${workerUsername} / password123)`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
