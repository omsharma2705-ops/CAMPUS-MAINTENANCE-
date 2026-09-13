require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_maintenance');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});

    console.log('Cleared existing collections...');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const workerPass = await bcrypt.hash('worker123', salt);
    const studentPass = await bcrypt.hash('student123', salt);

    // 1. Create Super Admin
    const admin = await User.create({
      name: 'Dr. Alok Verma (Chief Proctor)',
      email: 'admin@campus.edu',
      password: adminPass,
      role: 'admin',
      department: 'Campus Administration',
      phone: '+91 98111 22233',
    });

    // 2. Create Maintenance Workers
    const electrician = await User.create({
      name: 'Ramesh Kumar',
      email: 'worker@campus.edu', // default demo staff login
      password: workerPass,
      role: 'worker',
      department: 'Electrical Maintenance',
      phone: '+91 98222 33344',
    });

    const plumber = await User.create({
      name: 'Suresh Yadav',
      email: 'plumber@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'Plumbing & Water Supply',
      phone: '+91 98333 44455',
    });

    const carpenter = await User.create({
      name: 'Manoj Sharma',
      email: 'carpenter@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'Carpentry & Furniture',
      phone: '+91 98444 55566',
    });

    // 3. Create Students
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'student@campus.edu', // default demo student login
      password: studentPass,
      role: 'student',
      department: 'Computer Science & Engineering',
      phone: '+91 98555 66677',
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@campus.edu',
      password: studentPass,
      role: 'student',
      department: 'Electronics & Comm Engineering',
      phone: '+91 98666 77788',
    });

    console.log('Created Users (Admin, 3 Technicians, 2 Students)...');

    // 4. Create Sample Realistic Complaints
    await Complaint.create([
      {
        user: student1._id,
        title: 'Emergency: Sparking electrical switchboard in CS Lab 3',
        description: 'Main distribution box near server rack 2 is sparking intermittently with burning smell. Needs immediate technician.',
        category: 'Electrical / Lighting',
        priority: 'Emergency',
        department: 'Computer Science & Engineering',
        status: 'Assigned',
        assignedTo: electrician._id,
        location: { lat: 28.6142, lng: 77.2088, description: 'CS Block, 2nd Floor Lab 3' },
        adminRemarks: 'Ramesh, treat this as top emergency. Cut off power to rack 2 first.',
        timeline: [
          { status: 'Pending', message: 'Complaint lodged by Rahul Sharma', timestamp: new Date(Date.now() - 3600000 * 4) },
          { status: 'Assigned', message: 'Assigned to technician Ramesh Kumar (Electrical) by Super Admin', timestamp: new Date(Date.now() - 3600000 * 2) }
        ]
      },
      {
        user: student1._id,
        title: 'Severe water pipe leakage in Hostel Block A 2nd floor restroom',
        description: 'Overhead supply line fitting broke, water flooding the corridor floor.',
        category: 'Water Leakage / Plumbing',
        priority: 'High',
        department: 'Hostel Block A',
        status: 'In Progress',
        assignedTo: plumber._id,
        location: { lat: 28.6135, lng: 77.2095, description: 'Hostel A, Wing 2 Restroom' },
        workerRemarks: 'Turned off main riser valve. Currently replacing the 25mm PVC elbow joint.',
        timeline: [
          { status: 'Pending', message: 'Complaint lodged by Rahul Sharma', timestamp: new Date(Date.now() - 3600000 * 8) },
          { status: 'Assigned', message: 'Assigned to technician Suresh Yadav by Super Admin', timestamp: new Date(Date.now() - 3600000 * 6) },
          { status: 'In Progress', message: 'Technician Suresh Yadav started work on this issue.', timestamp: new Date(Date.now() - 3600000 * 3) }
        ]
      },
      {
        user: student2._id,
        title: 'Broken desk benches in Lecture Hall 102',
        description: 'Two front row wooden benches have broken support brackets and sharp nails exposed.',
        category: 'Broken Furniture (Bench/Desk)',
        priority: 'Medium',
        department: 'Admin & Faculty Block',
        status: 'Resolved',
        assignedTo: carpenter._id,
        location: { lat: 28.6128, lng: 77.2079, description: 'Lecture Hall Complex Ground Floor' },
        workerRemarks: 'Replaced wooden planks and bolted reinforced steel brackets. Workspace cleaned.',
        resolutionImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        resolvedAt: new Date(Date.now() - 3600000),
        timeline: [
          { status: 'Pending', message: 'Complaint lodged by Priya Patel', timestamp: new Date(Date.now() - 3600000 * 24) },
          { status: 'Assigned', message: 'Assigned to Manoj Sharma by Admin', timestamp: new Date(Date.now() - 3600000 * 18) },
          { status: 'In Progress', message: 'Manoj Sharma started work.', timestamp: new Date(Date.now() - 3600000 * 10) },
          { status: 'Resolved', message: 'Technician Manoj Sharma marked work completed with proof.', timestamp: new Date(Date.now() - 3600000) }
        ]
      },
      {
        user: student2._id,
        title: 'Split AC not cooling in Central Library Reading Room',
        description: 'AC unit is blowing room temperature air and making loud vibration noises.',
        category: 'AC / Fan Issue',
        priority: 'Medium',
        department: 'Campus Central Library',
        status: 'Closed',
        assignedTo: electrician._id,
        location: { lat: 28.6150, lng: 77.2100, description: 'Library 1st Floor Quiet Study Zone' },
        workerRemarks: 'Cleaned condenser coil and recharged refrigerant gas R32.',
        adminRemarks: 'Verified cooling efficiency (18°C output). Closed ticket.',
        resolutionImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        closedAt: new Date(Date.now() - 3600000 * 5),
        feedback: {
          rating: 5,
          comment: 'Fixed on the same day! The reading hall is nice and cold again. Great job.',
          createdAt: new Date(Date.now() - 3600000 * 2)
        },
        timeline: [
          { status: 'Pending', message: 'Complaint lodged by Priya Patel', timestamp: new Date(Date.now() - 3600000 * 48) },
          { status: 'Assigned', message: 'Assigned to Ramesh Kumar', timestamp: new Date(Date.now() - 3600000 * 36) },
          { status: 'In Progress', message: 'Ramesh Kumar started work.', timestamp: new Date(Date.now() - 3600000 * 20) },
          { status: 'Resolved', message: 'Work completed with proof.', timestamp: new Date(Date.now() - 3600000 * 10) },
          { status: 'Closed', message: 'Admin verified resolution proof and marked ticket Closed.', timestamp: new Date(Date.now() - 3600000 * 5) },
          { status: 'Feedback Received', message: 'Student submitted 5 ⭐ feedback: "Fixed on the same day! The reading hall is nice and cold again. Great job."', timestamp: new Date(Date.now() - 3600000 * 2) }
        ]
      },
      {
        user: student1._id,
        title: 'Garbage bins overflowing near Hostel Cafeteria entrance',
        description: 'Bins have not been emptied for two days, creating bad odor and stray dog issues.',
        category: 'Garbage / Cleanliness',
        priority: 'Low',
        department: 'Sports Complex / Cafeteria',
        status: 'Pending',
        location: { lat: 28.6130, lng: 77.2110, description: 'Cafeteria Back Lawn Gate' },
        timeline: [
          { status: 'Pending', message: 'Complaint lodged by Rahul Sharma', timestamp: new Date(Date.now() - 3600000 * 1) }
        ]
      }
    ]);

    console.log('✅ Demo database seeded successfully with rich sample complaints!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
