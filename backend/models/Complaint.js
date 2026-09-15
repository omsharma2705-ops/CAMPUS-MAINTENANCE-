const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ComplaintSchema = new mongoose.Schema({
  complaintNumber: {
    type: String,
    unique: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      // Primary required categories
      'Electrical',
      'Water',
      'Sanitaryware',
      'Furniture',
      'Doors',
      'IT',
      'HVAC',
      'Civil / Structural',
      'Cleanliness',
      'Other',
      // Backwards-compatible aliases
      'Water Leakage / Plumbing', 
      'Electrical / Lighting', 
      'Broken Furniture (Bench/Desk)', 
      'Washroom / Restroom Issue', 
      'Garbage / Cleanliness', 
      'AC / Fan Issue', 
      'IT / Lab Equipment', 
      'Building / Structural Damage'
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent', 'Emergency'],
    default: 'Medium',
  },
  department: {
    type: String,
    default: 'General Campus',
  },
  status: {
    type: String,
    enum: [
      'Registered',
      'Pending',
      'Assigned',
      'In Progress',
      'Awaiting Materials',
      'Work Completed',
      'Resolved',
      'Completed',
      'Closed'
    ],
    default: 'Registered',
  },
  location: {
    building: { type: String, default: 'General Campus' },
    floor: { type: String, default: 'Ground Floor' },
    room: { type: String, default: 'General Area' },
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    description: { type: String, default: '' }
  },
  imageUrl: {
    type: String,
    default: '',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null,
  },
  // Work Order Details
  workOrder: {
    workOrderNumber: { type: String, default: '' },
    assignedAt: { type: Date },
    slaHours: { type: Number, default: 24 }, // Urgent: 2h, High: 6h, Medium: 24h, Low: 48h
    slaDeadline: { type: Date },
    slaBreached: { type: Boolean, default: false },
    instructions: { type: String, default: '' },
    tradesmanType: { type: String, default: 'General Maintenance' }
  },
  beforeImageUrl: {
    type: String,
    default: '',
  },
  resolutionImageUrl: {
    type: String,
    default: '',
  },
  workerRemarks: {
    type: String,
    default: '',
  },
  adminRemarks: {
    type: String,
    default: '',
  },
  materialRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'materialRequest'
    }
  ],
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date }
  },
  // AI-Driven Fields
  isAiCategorized: {
    type: Boolean,
    default: false,
  },
  aiConfidence: {
    type: Number,
    default: 0,
  },
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    }
  ],
  timeline: [TimelineEventSchema],
  resolvedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('complaint', ComplaintSchema);
