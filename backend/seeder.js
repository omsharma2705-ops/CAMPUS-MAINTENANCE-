require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const InventoryItem = require('./models/InventoryItem');
const StoreLedger = require('./models/StoreLedger');
const MaterialRequest = require('./models/MaterialRequest');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_maintenance');
    console.log('Connected to MongoDB for complete requirements seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await InventoryItem.deleteMany({});
    await StoreLedger.deleteMany({});
    await MaterialRequest.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing collections...');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const workerPass = await bcrypt.hash('worker123', salt);
    const studentPass = await bcrypt.hash('student123', salt);

    // 1. Create Super Admin / Maintenance Manager
    const admin = await User.create({
      name: 'Dr. Alok Verma',
      email: 'admin@campus.edu',
      password: adminPass,
      role: 'admin',
      department: 'Campus Facilities Directorate',
      phone: '+91 98111 22233',
      cardId: 'CAMPUS-ADM-001',
    });

    // 2. Create Tradesmen (Electrician, Plumber, Carpenter, IT Tech, HVAC Tech)
    const electrician = await User.create({
      name: 'Ramesh Kumar',
      email: 'worker@campus.edu', // default demo staff login
      password: workerPass,
      role: 'worker',
      department: 'Electrical Maintenance',
      phone: '+91 98222 33344',
      cardId: 'CAMPUS-EMP-101',
      trade: 'Electrician',
    });

    const plumber = await User.create({
      name: 'Suresh Yadav',
      email: 'plumber@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'Plumbing & Water Supply',
      phone: '+91 98333 44455',
      cardId: 'CAMPUS-EMP-102',
      trade: 'Plumber',
    });

    const carpenter = await User.create({
      name: 'Manoj Sharma',
      email: 'carpenter@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'Carpentry & Furniture',
      phone: '+91 98444 55566',
      cardId: 'CAMPUS-EMP-103',
      trade: 'Carpenter',
    });

    const itTech = await User.create({
      name: 'Vikram Joshi',
      email: 'ittech@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'IT Infrastructure & Labs',
      phone: '+91 98555 11122',
      cardId: 'CAMPUS-EMP-104',
      trade: 'IT Technician',
    });

    const hvacTech = await User.create({
      name: 'Deepak Rao',
      email: 'hvac@campus.edu',
      password: workerPass,
      role: 'worker',
      department: 'HVAC & Climate Control',
      phone: '+91 98666 22233',
      cardId: 'CAMPUS-EMP-105',
      trade: 'HVAC Technician',
    });

    // 3. Create Students / Staff
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'student@campus.edu', // default demo student login
      password: studentPass,
      role: 'student',
      department: 'Computer Science & Engineering',
      phone: '+91 98777 66677',
      cardId: 'CAMPUS-STU-2024-4102',
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@campus.edu',
      password: studentPass,
      role: 'student',
      department: 'Electronics & Comm Engineering',
      phone: '+91 98888 77788',
      cardId: 'CAMPUS-STU-2024-5890',
    });

    console.log('Created Users with I-Cards & Trades...');

    // 4. Create Store Inventory Catalog
    const invItems = await InventoryItem.insertMany([
      {
        name: '16A Heavy Modular Switch',
        category: 'Electrical',
        sku: 'ELEC-SW-16A',
        quantity: 42,
        unit: 'pcs',
        unitCost: 145,
        lowStockThreshold: 15,
        locationShelf: 'Bay E1',
      },
      {
        name: '25mm PVC Elbow Fitting',
        category: 'Plumbing',
        sku: 'PLUMB-ELB-25',
        quantity: 8, // Low stock!
        unit: 'pcs',
        unitCost: 35,
        lowStockThreshold: 10,
        locationShelf: 'Bay P3',
      },
      {
        name: 'Half-inch Brass Tap Valve',
        category: 'Plumbing',
        sku: 'PLUMB-VALV-05',
        quantity: 26,
        unit: 'pcs',
        unitCost: 220,
        lowStockThreshold: 8,
        locationShelf: 'Bay P1',
      },
      {
        name: 'Heavy Duty Steel L-Bracket 4-inch',
        category: 'Carpentry',
        sku: 'CARP-BRK-4IN',
        quantity: 65,
        unit: 'pcs',
        unitCost: 55,
        lowStockThreshold: 20,
        locationShelf: 'Bay C2',
      },
      {
        name: 'Hydraulic Door Closer 60kg',
        category: 'Civil / Hardware',
        sku: 'DOOR-HYD-60K',
        quantity: 5, // Low stock!
        unit: 'pcs',
        unitCost: 850,
        lowStockThreshold: 6,
        locationShelf: 'Bay D1',
      },
      {
        name: 'CAT6 RJ45 Keystone Jack',
        category: 'IT',
        sku: 'IT-RJ45-KEY',
        quantity: 78,
        unit: 'pcs',
        unitCost: 90,
        lowStockThreshold: 25,
        locationShelf: 'Bay IT4',
      },
      {
        name: 'R32 Refrigerant Gas Cylinder (9kg)',
        category: 'HVAC',
        sku: 'HVAC-GAS-R32',
        quantity: 3, // Low stock!
        unit: 'cylinders',
        unitCost: 4200,
        lowStockThreshold: 4,
        locationShelf: 'Bay H1-GasVault',
      },
      {
        name: '36W LED Batten Tubelight 4ft',
        category: 'Electrical',
        sku: 'ELEC-TUBE-36W',
        quantity: 34,
        unit: 'pcs',
        unitCost: 280,
        lowStockThreshold: 12,
        locationShelf: 'Bay E3',
      },
      {
        name: 'Dual Flush Restroom Cistern Valve',
        category: 'Sanitaryware',
        sku: 'SANI-FLUSH-VAL',
        quantity: 14,
        unit: 'pcs',
        unitCost: 480,
        lowStockThreshold: 6,
        locationShelf: 'Bay S2',
      }
    ]);

    console.log('Created Store Inventory items...');

    // 5. Create Initial Store Ledger entries
    for (const item of invItems) {
      await StoreLedger.create({
        item: item._id,
        itemName: item.name,
        sku: item.sku,
        type: 'Received',
        quantity: item.quantity + 5,
        balanceAfter: item.quantity + 5,
        unit: item.unit,
        handledBy: admin._id,
        notes: 'Initial institutional batch receipt',
        timestamp: new Date(Date.now() - 86400000 * 7),
      });
    }

    // 6. Seed Realistic Complaints across Life-cycle
    const now = Date.now();

    // Complaint 1: Urgent Electrical (Work Order Created, In Progress, 2h SLA)
    const c1 = await Complaint.create({
      complaintNumber: 'CMP-20260914-1001',
      user: student1._id,
      title: 'Sparks and burning smell from switchboard in Lab 3',
      description: 'Distribution box near Server Rack 2 is intermittently sparking with noticeable ozone burning smell. High risk to equipment.',
      category: 'Electrical',
      priority: 'Urgent',
      department: 'Computer Science Department',
      status: 'In Progress',
      assignedTo: electrician._id,
      location: {
        building: 'Computer Science Department',
        floor: '2nd Floor',
        room: 'Lab 3 (Server Wing)',
        lat: 28.6142,
        lng: 77.2088,
        description: 'Next to Rack 2 switchboard panel'
      },
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      beforeImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      workOrder: {
        workOrderNumber: 'WO-20260914-8801',
        assignedAt: new Date(now - 3600000 * 1), // 1 hour ago
        slaHours: 2,
        slaDeadline: new Date(now + 3600000 * 1), // 1 hour remaining!
        slaBreached: false,
        instructions: 'Cut main sub-breaker first. Replace damaged 16A modular socket and tighten lug connections.',
        tradesmanType: 'Electrician'
      },
      workerRemarks: 'Sub-panel isolated. Disassembling charred switch plate.',
      timeline: [
        { status: 'Registered', message: 'Complaint #CMP-20260914-1001 registered by Rahul Sharma (I-Card: CAMPUS-STU-2024-4102)', timestamp: new Date(now - 3600000 * 2) },
        { status: 'Assigned', message: 'Work Order #WO-20260914-8801 created. Assigned to Electrician Ramesh Kumar. SLA target: 2 Hours (Urgent).', timestamp: new Date(now - 3600000 * 1) },
        { status: 'In Progress', message: 'Electrician Ramesh Kumar reached site and started diagnostics.', timestamp: new Date(now - 1800000) }
      ]
    });

    // Complaint 2: High Water Leakage (Awaiting Materials from Stores)
    const c2 = await Complaint.create({
      complaintNumber: 'CMP-20260914-1002',
      user: student1._id,
      title: 'Water supply pipe rupture flooding 2nd floor restroom',
      description: 'The overhead supply elbow broke under pressure, water flooding corridor floor.',
      category: 'Water',
      priority: 'High',
      department: 'Hostel Block A',
      status: 'Awaiting Materials',
      assignedTo: plumber._id,
      location: {
        building: 'Hostel Block A',
        floor: '2nd Floor',
        room: 'East Wing Restroom',
        lat: 28.6135,
        lng: 77.2095,
        description: 'Riser pipe behind cubicle 3'
      },
      workOrder: {
        workOrderNumber: 'WO-20260914-8802',
        assignedAt: new Date(now - 3600000 * 4),
        slaHours: 6,
        slaDeadline: new Date(now + 3600000 * 2), // 2h left
        slaBreached: false,
        instructions: 'Shut off riser valve immediately. Replace cracked PVC elbow and install heavy union.',
        tradesmanType: 'Plumber'
      },
      timeline: [
        { status: 'Registered', message: 'Complaint #CMP-20260914-1002 registered by Rahul Sharma', timestamp: new Date(now - 3600000 * 5) },
        { status: 'Assigned', message: 'Work Order #WO-20260914-8802 issued to Plumber Suresh Yadav. 6h SLA.', timestamp: new Date(now - 3600000 * 4) },
        { status: 'Awaiting Materials', message: 'Plumber Suresh Yadav requested 2x 25mm PVC Elbow from Stores.', timestamp: new Date(now - 3600000 * 2) }
      ]
    });

    // Material Request for Complaint 2
    const matReq = await MaterialRequest.create({
      complaint: c2._id,
      complaintNumber: c2.complaintNumber,
      workOrderNumber: c2.workOrder.workOrderNumber,
      requestedBy: plumber._id,
      items: [
        { item: invItems[1]._id, itemName: invItems[1].name, quantity: 2, unit: 'pcs' }
      ],
      reason: 'Urgent replacement of fractured riser elbow',
      status: 'Pending',
      createdAt: new Date(now - 3600000 * 2),
    });
    c2.materialRequests.push(matReq._id);
    await c2.save();

    // Complaint 3: Furniture (Completed & Verified by Manager with Feedback)
    const c3 = await Complaint.create({
      complaintNumber: 'CMP-20260914-1003',
      user: student2._id,
      title: 'Broken wooden lecture benches with sharp exposed nails',
      description: 'Two benches in front row have broken support brackets causing them to tilt precariously.',
      category: 'Furniture',
      priority: 'Medium',
      department: 'Lecture Hall Complex',
      status: 'Completed',
      assignedTo: carpenter._id,
      location: {
        building: 'Lecture Hall Complex',
        floor: '1st Floor',
        room: 'LH 102',
        lat: 28.6128,
        lng: 77.2079,
        description: 'Row 1, Seat 3-4'
      },
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      beforeImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
      workerRemarks: 'Replaced cracked teak plank, secured with 4 heavy steel L-brackets, sanded and re-varnished.',
      adminRemarks: 'Inspected on site. Bench load test passed (150kg). Clean finish.',
      workOrder: {
        workOrderNumber: 'WO-20260914-8803',
        assignedAt: new Date(now - 86400000 * 2),
        slaHours: 24,
        slaDeadline: new Date(now - 86400000 * 1),
        slaBreached: false,
        instructions: 'Repair benches before morning class at 9 AM.',
        tradesmanType: 'Carpenter'
      },
      resolvedAt: new Date(now - 86400000 * 1.5),
      closedAt: new Date(now - 86400000 * 1),
      feedback: {
        rating: 5,
        comment: 'Fixed super fast! Sturdy and safe again before our 9 AM fluid mechanics lecture. Thank you!',
        createdAt: new Date(now - 86400000 * 0.8)
      },
      timeline: [
        { status: 'Registered', message: 'Complaint registered by Priya Patel (I-Card: CAMPUS-STU-2024-5890)', timestamp: new Date(now - 86400000 * 2.5) },
        { status: 'Assigned', message: 'Work Order #WO-20260914-8803 issued to Carpenter Manoj Sharma.', timestamp: new Date(now - 86400000 * 2) },
        { status: 'In Progress', message: 'Carpenter started bench restoration.', timestamp: new Date(now - 86400000 * 1.8) },
        { status: 'Resolved', message: 'Carpenter completed repairs and submitted resolution proof.', timestamp: new Date(now - 86400000 * 1.5) },
        { status: 'Completed', message: 'Manager verified work quality and marked Completed.', timestamp: new Date(now - 86400000 * 1) },
        { status: 'Feedback Received', message: 'Student gave 5 ⭐ review.', timestamp: new Date(now - 86400000 * 0.8) }
      ]
    });

    // Complaint 4: Brand New Registered Complaint (Awaiting Manager Review)
    const c4 = await Complaint.create({
      complaintNumber: 'CMP-20260914-1004',
      user: student2._id,
      title: 'Central Library quiet study area AC unit blowing warm air',
      description: 'The split AC unit is making loud compressor humming sounds and not blowing cold air. Room temperature is 32°C.',
      category: 'HVAC',
      priority: 'Medium',
      department: 'Campus Central Library',
      status: 'Registered', // Initial status!
      location: {
        building: 'Campus Central Library',
        floor: '2nd Floor',
        room: 'Quiet Study Hall Room 204',
        lat: 28.6150,
        lng: 77.2100,
        description: 'North wall near aisle 4'
      },
      timeline: [
        { status: 'Registered', message: 'Complaint #CMP-20260914-1004 registered by Priya Patel. Awaiting Maintenance Manager review.', timestamp: new Date(now - 1800000) }
      ]
    });

    // Complaint 5: Doors & Hardware (Resolved, Awaiting Manager Verification)
    const c5 = await Complaint.create({
      complaintNumber: 'CMP-20260914-1005',
      user: student1._id,
      title: 'Hostel fire exit door hydraulic arm unbolted and slamming',
      description: 'Heavy metal fire door is slamming violently in wind, creating security hazard.',
      category: 'Doors',
      priority: 'High',
      department: 'Hostel Block A',
      status: 'Resolved', // Work completed by carpenter, ready for manager inspection
      assignedTo: carpenter._id,
      location: {
        building: 'Hostel Block A',
        floor: 'Ground Floor',
        room: 'Exit Gate West',
        lat: 28.6133,
        lng: 77.2091,
        description: 'West Staircase Fire Exit'
      },
      beforeImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      workerRemarks: 'Re-aligned hydraulic closer and bolted using M8 anchor bolts. Sweep speed calibrated.',
      workOrder: {
        workOrderNumber: 'WO-20260914-8805',
        assignedAt: new Date(now - 3600000 * 5),
        slaHours: 6,
        slaDeadline: new Date(now + 3600000 * 1),
        slaBreached: false,
        instructions: 'Anchor door closer securely.',
        tradesmanType: 'Carpenter'
      },
      resolvedAt: new Date(now - 3600000 * 1),
      timeline: [
        { status: 'Registered', message: 'Complaint registered by Rahul Sharma', timestamp: new Date(now - 3600000 * 6) },
        { status: 'Assigned', message: 'Assigned to Manoj Sharma', timestamp: new Date(now - 3600000 * 5) },
        { status: 'In Progress', message: 'Work commenced', timestamp: new Date(now - 3600000 * 3) },
        { status: 'Resolved', message: 'Tradesman marked work completed with proof photos.', timestamp: new Date(now - 3600000 * 1) }
      ]
    });

    console.log('Created Complaints with unique CMP# and Work Orders...');

    // 7. Seed Multi-Channel Notifications (In-App, Email, SMS)
    await Notification.create([
      {
        recipient: student1._id,
        title: 'Complaint Registered #CMP-20260914-1001',
        message: 'Your urgent electrical issue in Lab 3 has been lodged and sent to the Facilities Command Center.',
        type: 'Registration',
        complaint: c1._id,
        complaintNumber: c1.complaintNumber,
        isRead: false,
        emailDeliveryStatus: `Sent to ${student1.email} (University SMTP Gateway)`,
        smsDeliveryStatus: `Dispatched to ${student1.phone} via Campus SMS Gateway`,
      },
      {
        recipient: electrician._id,
        title: 'Work Order Assigned #WO-20260914-8801',
        message: 'You have been assigned to Complaint #CMP-20260914-1001 (Electrical). SLA: 2 Hours (Urgent).',
        type: 'Assignment',
        complaint: c1._id,
        complaintNumber: c1.complaintNumber,
        isRead: false,
        emailDeliveryStatus: `Sent to ${electrician.email} (University Staff Mail)`,
        smsDeliveryStatus: `Dispatched to ${electrician.phone}`,
      },
      {
        recipient: student2._id,
        title: 'Work Verified & Completed #CMP-20260914-1003',
        message: 'Your complaint regarding Lecture Hall 102 furniture has been verified and closed by Dr. Alok Verma.',
        type: 'Completion',
        complaint: c3._id,
        complaintNumber: c3.complaintNumber,
        isRead: true,
        emailDeliveryStatus: `Sent to ${student2.email}`,
        smsDeliveryStatus: `Dispatched to ${student2.phone}`,
      }
    ]);

    console.log('✅ Demo database successfully seeded with all requirements (I-Cards, Work Orders, SLA, Stores, Notifications)!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
