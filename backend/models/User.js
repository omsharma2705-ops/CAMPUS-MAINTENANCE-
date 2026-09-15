const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'worker', 'admin'],
    default: 'student',
  },
  department: {
    type: String, // E.g., 'Computer Science', 'Hostel Warden', or for workers: 'Electrical', 'Plumbing', etc.
    default: 'General',
  },
  phone: {
    type: String,
    default: '',
  },
  cardId: {
    type: String, // University I-Card Number, e.g., 'CAMPUS-2024-8891'
    trim: true,
    sparse: true,
  },
  trade: {
    type: String, // E.g., 'Electrician', 'Plumber', 'Carpenter', 'IT Technician', 'HVAC Technician', 'General Maintenance'
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('user', UserSchema);
