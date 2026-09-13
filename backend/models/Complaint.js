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
      'Water Leakage / Plumbing', 
      'Electrical / Lighting', 
      'Broken Furniture (Bench/Desk)', 
      'Washroom / Restroom Issue', 
      'Garbage / Cleanliness', 
      'AC / Fan Issue', 
      'IT / Lab Equipment', 
      'Building / Structural Damage',
      'Other'
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium',
  },
  department: {
    type: String,
    default: 'General Campus',
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    description: { type: String, default: '' }
  },
  imageUrl: {
    type: String, // Initial complaint photo
    default: '',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null,
  },
  resolutionImageUrl: {
    type: String, // Resolution proof photo uploaded by technician
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
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date }
  },
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
