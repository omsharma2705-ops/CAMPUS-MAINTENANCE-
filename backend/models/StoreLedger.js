const mongoose = require('mongoose');

const StoreLedgerSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inventoryItem',
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['Issued', 'Received', 'Adjustment'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'pcs',
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
  workOrderNumber: {
    type: String,
    default: '',
  },
  tradesman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null,
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  notes: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('storeLedger', StoreLedgerSchema);
