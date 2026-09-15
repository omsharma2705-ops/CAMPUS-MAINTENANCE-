const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Registration', 'Assignment', 'Material', 'Completion', 'General', 'SLA Alert'],
    default: 'General',
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true }
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'complaint',
    default: null,
  },
  complaintNumber: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  emailDeliveryStatus: {
    type: String,
    default: 'Delivered (Simulated SMTP)',
  },
  smsDeliveryStatus: {
    type: String,
    default: 'Delivered (Simulated SMS Gateway)',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('notification', NotificationSchema);
