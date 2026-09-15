const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const InventoryItem = require('../models/InventoryItem');
const StoreLedger = require('../models/StoreLedger');
const MaterialRequest = require('../models/MaterialRequest');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// @route   GET api/stores/inventory
// @desc    Get all inventory items with low-stock alerts
// @access  Private
router.get('/inventory', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await InventoryItem.find(query).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Inventory fetch error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch inventory items' });
  }
});

// @route   POST api/stores/inventory
// @desc    Add a new inventory item
// @access  Admin / Store Keeper
router.post('/inventory', auth, async (req, res) => {
  try {
    const { name, category, sku, quantity, unit, unitCost, lowStockThreshold, locationShelf } = req.body;

    const existingSku = await InventoryItem.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      return res.status(400).json({ msg: 'Item with this SKU already exists.' });
    }

    const item = new InventoryItem({
      name,
      category,
      sku: sku.toUpperCase().trim(),
      quantity: Number(quantity) || 0,
      unit: unit || 'pcs',
      unitCost: Number(unitCost) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 10,
      locationShelf: locationShelf || 'Main Bay',
    });

    await item.save();

    // Log initial stock ledger entry
    if (item.quantity > 0) {
      const ledger = new StoreLedger({
        item: item._id,
        itemName: item.name,
        sku: item.sku,
        type: 'Received',
        quantity: item.quantity,
        balanceAfter: item.quantity,
        unit: item.unit,
        handledBy: req.user.id,
        notes: 'Initial inventory catalog onboarded',
      });
      await ledger.save();
    }

    res.json(item);
  } catch (err) {
    console.error('Add inventory item error:', err.message);
    res.status(500).json({ msg: 'Failed to add inventory item' });
  }
});

// @route   POST api/stores/restock
// @desc    Receive stock (Restock material) & record in ledger
// @access  Admin / Store Keeper
router.post('/restock', auth, async (req, res) => {
  try {
    const { itemId, quantity, notes, poReference } = req.body;
    const addQty = Number(quantity);

    if (!itemId || !addQty || addQty <= 0) {
      return res.status(400).json({ msg: 'Please specify item and valid positive quantity.' });
    }

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: 'Inventory item not found.' });
    }

    item.quantity += addQty;
    item.updatedAt = new Date();
    await item.save();

    // Record in ledger
    const ledger = new StoreLedger({
      item: item._id,
      itemName: item.name,
      sku: item.sku,
      type: 'Received',
      quantity: addQty,
      balanceAfter: item.quantity,
      unit: item.unit,
      handledBy: req.user.id,
      notes: notes || `Restocked ${addQty} ${item.unit}. PO: ${poReference || 'DIRECT-RESTOCK'}`,
    });
    await ledger.save();

    res.json({ msg: 'Stock received and ledger recorded successfully', item, ledger });
  } catch (err) {
    console.error('Restock error:', err.message);
    res.status(500).json({ msg: 'Failed to record received stock' });
  }
});

// @route   GET api/stores/requests
// @desc    Get all material requisitions from tradesmen
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const requests = await MaterialRequest.find(query)
      .populate('requestedBy', ['name', 'department', 'trade', 'phone'])
      .populate('issuedBy', ['name'])
      .populate('complaint', ['title', 'category', 'priority', 'location'])
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch material requests' });
  }
});

// @route   POST api/stores/requests/:id/issue
// @desc    Issue requested materials (deduct stock, record in ledger, update complaint)
// @access  Admin / Store Keeper
router.post('/requests/:id/issue', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only Stores / Admin can issue materials.' });
    }

    const materialReq = await MaterialRequest.findById(req.params.id)
      .populate('requestedBy')
      .populate('complaint');

    if (!materialReq) {
      return res.status(404).json({ msg: 'Material request not found.' });
    }

    if (materialReq.status === 'Issued') {
      return res.status(400).json({ msg: 'Materials have already been issued for this request.' });
    }

    // Check availability for all items
    for (const reqItem of materialReq.items) {
      let item = null;
      if (reqItem.item) {
        item = await InventoryItem.findById(reqItem.item);
      } else {
        item = await InventoryItem.findOne({ name: new RegExp('^' + reqItem.itemName + '$', 'i') });
      }

      if (item && item.quantity < reqItem.quantity) {
        return res.status(400).json({
          msg: `Insufficient stock for "${item.name}". Required: ${reqItem.quantity} ${item.unit}, In Stock: ${item.quantity} ${item.unit}`
        });
      }
    }

    // Deduct stock and record in ledger
    for (const reqItem of materialReq.items) {
      let item = null;
      if (reqItem.item) {
        item = await InventoryItem.findById(reqItem.item);
      } else {
        item = await InventoryItem.findOne({ name: new RegExp('^' + reqItem.itemName + '$', 'i') });
      }

      if (item) {
        item.quantity -= reqItem.quantity;
        item.updatedAt = new Date();
        await item.save();

        const ledger = new StoreLedger({
          item: item._id,
          itemName: item.name,
          sku: item.sku,
          type: 'Issued',
          quantity: reqItem.quantity,
          balanceAfter: item.quantity,
          unit: item.unit,
          complaint: materialReq.complaint?._id || null,
          complaintNumber: materialReq.complaintNumber || '',
          workOrderNumber: materialReq.workOrderNumber || '',
          tradesman: materialReq.requestedBy?._id || null,
          handledBy: req.user.id,
          notes: `Issued to ${materialReq.requestedBy?.name || 'Tradesman'} for Work Order #${materialReq.workOrderNumber || 'N/A'}`,
        });
        await ledger.save();
      }
    }

    materialReq.status = 'Issued';
    materialReq.issuedBy = req.user.id;
    materialReq.issuedAt = new Date();
    await materialReq.save();

    // Update Complaint status
    if (materialReq.complaint) {
      const complaint = await Complaint.findById(materialReq.complaint._id);
      if (complaint) {
        complaint.status = 'In Progress';
        complaint.timeline.push({
          status: 'In Progress',
          message: `Stores issued required materials (${materialReq.items.map(i => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')}). Work resumed.`,
          actionBy: req.user.id,
          timestamp: new Date(),
        });
        await complaint.save();
      }
    }

    // Dispatch Notification to Tradesman
    if (materialReq.requestedBy) {
      await sendNotification({
        recipientId: materialReq.requestedBy._id,
        title: `Materials Issued: WO #${materialReq.workOrderNumber}`,
        message: `Stores has issued your requested spare parts for Complaint #${materialReq.complaintNumber}. You may collect them from Bay A and proceed with repair.`,
        type: 'Material',
        complaint: materialReq.complaint?._id,
        complaintNumber: materialReq.complaintNumber,
      });
    }

    res.json({ msg: 'Materials issued successfully and ledger recorded.', materialReq });
  } catch (err) {
    console.error('Issue material error:', err.message);
    res.status(500).json({ msg: 'Failed to issue materials' });
  }
});

// @route   POST api/stores/requests/:id/reject
// @desc    Reject material requisition
// @access  Admin
router.post('/requests/:id/reject', auth, async (req, res) => {
  try {
    const { remarks } = req.body;
    const materialReq = await MaterialRequest.findById(req.params.id).populate('requestedBy');

    if (!materialReq) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    materialReq.status = 'Rejected';
    materialReq.storeRemarks = remarks || 'Request rejected by store manager.';
    await materialReq.save();

    if (materialReq.requestedBy) {
      await sendNotification({
        recipientId: materialReq.requestedBy._id,
        title: `Requisition Rejected: WO #${materialReq.workOrderNumber}`,
        message: `Your spare parts request was rejected: "${remarks || 'Materials unavailable or not approved'}"`,
        type: 'Material',
        complaint: materialReq.complaint,
        complaintNumber: materialReq.complaintNumber,
      });
    }

    res.json({ msg: 'Request marked as rejected.', materialReq });
  } catch (err) {
    console.error('Reject request error:', err.message);
    res.status(500).json({ msg: 'Failed to reject request' });
  }
});

// @route   GET api/stores/ledger
// @desc    Get chronological transaction ledger
// @access  Private
router.get('/ledger', auth, async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    let query = {};
    if (type && type !== 'All') {
      query.type = type;
    }

    const ledger = await StoreLedger.find(query)
      .populate('handledBy', ['name'])
      .populate('tradesman', ['name', 'trade'])
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json(ledger);
  } catch (err) {
    console.error('Ledger error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch store ledger' });
  }
});

// @route   GET api/stores/stats
// @desc    Get store usage & inventory KPI summary
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    const allItems = await InventoryItem.find();
    
    let totalValuation = 0;
    let lowStockCount = 0;
    const lowStockItems = [];

    allItems.forEach(item => {
      totalValuation += (item.quantity * item.unitCost);
      if (item.quantity <= item.lowStockThreshold) {
        lowStockCount++;
        lowStockItems.push(item);
      }
    });

    const pendingRequests = await MaterialRequest.countDocuments({ status: 'Pending' });
    const issuedRequests = await MaterialRequest.countDocuments({ status: 'Issued' });

    // Most consumed items from ledger
    const topConsumed = await StoreLedger.aggregate([
      { $match: { type: 'Issued' } },
      { $group: { _id: '$itemName', totalQuantity: { $sum: '$quantity' }, count: { $sum: 1 } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      totalItems,
      totalValuation: Math.round(totalValuation),
      lowStockCount,
      lowStockItems,
      pendingRequests,
      issuedRequests,
      topConsumed,
    });
  } catch (err) {
    console.error('Store stats error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch store stats' });
  }
});

module.exports = router;
