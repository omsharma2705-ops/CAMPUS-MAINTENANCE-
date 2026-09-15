const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      'Electrical',
      'Plumbing',
      'Carpentry',
      'HVAC',
      'IT',
      'Sanitaryware',
      'Civil / Hardware',
      'Cleanliness'
    ],
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    default: 'pcs', // pcs, meters, kg, boxes, cylinders, liters
  },
  unitCost: {
    type: Number,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  locationShelf: {
    type: String,
    default: 'Main Store Bay A',
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

// Virtual property to flag reorder alert
InventoryItemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.lowStockThreshold;
});

InventoryItemSchema.set('toJSON', { virtuals: true });
InventoryItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('inventoryItem', InventoryItemSchema);
