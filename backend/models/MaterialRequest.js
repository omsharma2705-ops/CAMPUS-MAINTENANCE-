const mongoose = require('mongoose');

const RequestedItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inventoryItem',
  },
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
});

const MaterialRequestSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'complaint',
    required: true,
  },
  complaintNumber: {
    type: String,
    default: '',
  },
  workOrderNumber: {
    type: String,
    default: '',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  items: [RequestedItemSchema],
  reason: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Issued', 'Rejected'],
    default: 'Pending',
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null,
  },
  issuedAt: {
    type: Date,
  },
  storeRemarks: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('materialRequest', MaterialRequestSchema);
