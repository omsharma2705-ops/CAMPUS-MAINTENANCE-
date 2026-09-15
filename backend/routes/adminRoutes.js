const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const InventoryItem = require('../models/InventoryItem');
const StoreLedger = require('../models/StoreLedger');
const aiService = require('../services/aiService');

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Super Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Auth validation error' });
  }
};

// @route   GET api/admin/predictive
// @desc    AI Predictive Maintenance & Chronic Recurring Hotspots
// @access  Admin only
router.get('/predictive', [auth, adminOnly], async (req, res) => {
  try {
    const allComplaints = await Complaint.find().sort({ createdAt: -1 });
    const predictiveReport = aiService.analyzeRecurringAndPredictive(allComplaints);
    res.json(predictiveReport);
  } catch (err) {
    console.error('Predictive API error:', err.message);
    res.status(500).json({ msg: 'Failed to generate predictive maintenance report' });
  }
});

// @route   GET api/admin/analytics
// @desc    Get comprehensive KPI dashboard metrics (Total, Addressed, Pending, SLA, Store usage, Tradesman efficiency)
// @access  Admin only
router.get('/analytics', [auth, adminOnly], async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const registered = await Complaint.countDocuments({ status: 'Registered' });
    const pending = await Complaint.countDocuments({ status: { $in: ['Registered', 'Pending'] } });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: { $in: ['In Progress', 'Awaiting Materials'] } });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const completed = await Complaint.countDocuments({ status: { $in: ['Completed', 'Closed'] } });
    const addressed = resolved + completed;

    // SLA Calculation
    const complaintsWithSLA = await Complaint.find({ 'workOrder.slaDeadline': { $exists: true, $ne: null } });
    let slaBreachedCount = 0;
    let slaMetCount = 0;
    const now = new Date();

    complaintsWithSLA.forEach(c => {
      const deadline = new Date(c.workOrder.slaDeadline);
      if (['Resolved', 'Completed', 'Closed'].includes(c.status)) {
        const finishTime = c.resolvedAt || c.closedAt || c.updatedAt;
        if (finishTime > deadline || c.workOrder.slaBreached) {
          slaBreachedCount++;
        } else {
          slaMetCount++;
        }
      } else {
        // Active complaint
        if (now > deadline) {
          slaBreachedCount++;
        } else {
          slaMetCount++;
        }
      }
    });

    const slaComplianceRate = complaintsWithSLA.length > 0 
      ? Math.round((slaMetCount / complaintsWithSLA.length) * 100) 
      : 100;

    // Priority counts
    const lowPriority = await Complaint.countDocuments({ priority: 'Low' });
    const mediumPriority = await Complaint.countDocuments({ priority: 'Medium' });
    const highPriority = await Complaint.countDocuments({ priority: 'High' });
    const urgentPriority = await Complaint.countDocuments({ priority: { $in: ['Urgent', 'Emergency'] } });

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const departmentStats = await Complaint.aggregate([
      { $group: { _id: { $ifNull: ['$location.building', '$department'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const feedbackStats = await Complaint.aggregate([
      { $match: { 'feedback.rating': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$feedback.rating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    // Store & Inventory usage stats
    const totalInventoryItems = await InventoryItem.countDocuments();
    const inventoryItems = await InventoryItem.find();
    let totalStockValue = 0;
    let lowStockCount = 0;
    inventoryItems.forEach(it => {
      totalStockValue += (it.quantity * it.unitCost);
      if (it.quantity <= it.lowStockThreshold) lowStockCount++;
    });

    const totalMaterialsIssued = await StoreLedger.countDocuments({ type: 'Issued' });

    const workerCount = await User.countDocuments({ role: 'worker' });
    const studentCount = await User.countDocuments({ role: 'student' });
    const aiCategorizedCount = await Complaint.countDocuments({ isAiCategorized: true });

    res.json({
      summary: {
        totalComplaints,
        registered,
        pending,
        assigned,
        inProgress,
        resolved,
        completed,
        addressed,
        activeQueue: pending + assigned + inProgress,
        resolutionRate: totalComplaints ? Math.round((addressed / totalComplaints) * 100) : 0,
        slaComplianceRate,
        slaBreachedCount,
        slaTrackedCount: complaintsWithSLA.length,
        workerCount,
        studentCount,
        aiCategorizedCount,
        aiAdoptionRate: totalComplaints ? Math.round((aiCategorizedCount / totalComplaints) * 100) : 0,
        avgRating: feedbackStats.length > 0 ? Number(feedbackStats[0].avgRating.toFixed(1)) : 5.0,
        totalFeedbacks: feedbackStats.length > 0 ? feedbackStats[0].totalFeedbacks : 0,
        store: {
          totalItems: totalInventoryItems,
          totalStockValue: Math.round(totalStockValue),
          lowStockCount,
          totalMaterialsIssued,
        }
      },
      priorities: {
        Low: lowPriority,
        Medium: mediumPriority,
        High: highPriority,
        Urgent: urgentPriority,
        Emergency: urgentPriority,
      },
      categories: categoryStats,
      departments: departmentStats,
    });
  } catch (err) {
    console.error('Admin analytics error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch analytics' });
  }
});

// @route   GET api/admin/workers
// @desc    Get all maintenance staff members with Tradesman Efficiency metrics
// @access  Admin only
router.get('/workers', [auth, adminOnly], async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password').sort({ name: 1 });

    const workersWithMetrics = await Promise.all(
      workers.map(async (w) => {
        const assignedComplaints = await Complaint.find({ assignedTo: w._id });
        
        const activeTasks = assignedComplaints.filter(c => ['Assigned', 'In Progress', 'Awaiting Materials'].includes(c.status)).length;
        const completedTasks = assignedComplaints.filter(c => ['Resolved', 'Completed', 'Closed'].includes(c.status)).length;

        // Turnaround Time & Rating
        let totalHours = 0;
        let ratedCount = 0;
        let totalRating = 0;
        let slaMetCount = 0;
        let totalTrackedSLA = 0;

        assignedComplaints.forEach(c => {
          if (c.feedback?.rating) {
            ratedCount++;
            totalRating += c.feedback.rating;
          }

          if (c.workOrder?.assignedAt && c.resolvedAt) {
            const diffHours = (new Date(c.resolvedAt) - new Date(c.workOrder.assignedAt)) / 3600000;
            totalHours += Math.max(0.2, diffHours);
          }

          if (c.workOrder?.slaDeadline) {
            totalTrackedSLA++;
            if (!c.workOrder.slaBreached) slaMetCount++;
          }
        });

        const avgTurnaroundHours = completedTasks > 0 ? Number((totalHours / completedTasks).toFixed(1)) : 0;
        const avgRating = ratedCount > 0 ? Number((totalRating / ratedCount).toFixed(1)) : 5.0;
        const slaAdherence = totalTrackedSLA > 0 ? Math.round((slaMetCount / totalTrackedSLA) * 100) : 100;

        return {
          ...w.toObject(),
          trade: w.trade || w.department || 'General Maintenance',
          activeTasks,
          completedTasks,
          totalAssigned: assignedComplaints.length,
          avgTurnaroundHours: avgTurnaroundHours || 1.8,
          avgRating,
          slaAdherence,
        };
      })
    );

    res.json(workersWithMetrics);
  } catch (err) {
    console.error('Error fetching workers:', err.message);
    res.status(500).json({ msg: 'Failed to fetch workers' });
  }
});

// @route   POST api/admin/workers
// @desc    Admin creates a new maintenance technician with Trade specialization
// @access  Admin only
router.post('/workers', [auth, adminOnly], async (req, res) => {
  const { name, email, password, department, phone, trade, cardId } = req.body;

  try {
    let existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }

    const generatedCardId = cardId || `STAFF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newWorker = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'worker',
      department: department || 'Campus Maintenance',
      phone: phone || '',
      trade: trade || 'Electrician',
      cardId: generatedCardId,
    });

    const salt = await bcrypt.genSalt(10);
    newWorker.password = await bcrypt.hash(password, salt);

    await newWorker.save();

    res.json({
      msg: 'Maintenance technician registered successfully',
      worker: {
        id: newWorker._id,
        name: newWorker.name,
        email: newWorker.email,
        department: newWorker.department,
        phone: newWorker.phone,
        trade: newWorker.trade,
        cardId: newWorker.cardId,
        role: newWorker.role,
      }
    });
  } catch (err) {
    console.error('Create worker error:', err.message);
    res.status(500).json({ msg: 'Failed to create worker account' });
  }
});

// @route   GET api/admin/export/complaints
// @desc    Export structured complaint data for Excel / CSV download
// @access  Admin only
router.get('/export/complaints', [auth, adminOnly], async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', ['name', 'email', 'cardId'])
      .populate('assignedTo', ['name', 'trade'])
      .sort({ createdAt: -1 });

    const exportData = complaints.map(c => ({
      complaintNumber: c.complaintNumber || 'N/A',
      title: c.title,
      category: c.category,
      priority: c.priority,
      status: c.status,
      building: c.location?.building || c.department || 'General',
      floor: c.location?.floor || 'Ground Floor',
      room: c.location?.room || 'N/A',
      lodgedBy: c.user?.name || 'Anonymous',
      lodgerCardId: c.user?.cardId || 'N/A',
      tradesman: c.assignedTo?.name || 'Unassigned',
      trade: c.assignedTo?.trade || 'N/A',
      workOrderNumber: c.workOrder?.workOrderNumber || 'N/A',
      slaHours: c.workOrder?.slaHours || 24,
      slaStatus: c.workOrder?.slaBreached ? 'Breached' : 'Within SLA',
      rating: c.feedback?.rating ? `${c.feedback.rating} Star` : 'Not Rated',
      registeredAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
      completedAt: c.closedAt || c.resolvedAt ? new Date(c.closedAt || c.resolvedAt).toLocaleString() : 'Pending',
    }));

    res.json(exportData);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ msg: 'Failed to export complaint records' });
  }
});

// @route   POST api/admin/complaints/merge-master
// @desc    Admin merges multiple related complaints into one Master Incident
// @access  Admin only
router.post('/complaints/merge-master', [auth, adminOnly], async (req, res) => {
  try {
    const { masterId, childIds } = req.body;
    if (!masterId || !childIds || !childIds.length) {
      return res.status(400).json({ msg: 'masterId and childIds array are required.' });
    }

    const master = await Complaint.findById(masterId);
    if (!master) {
      return res.status(404).json({ msg: 'Master complaint not found.' });
    }

    const filteredChildIds = childIds.filter(id => id !== masterId);

    master.isMasterIncident = true;
    master.linkedComplaints = Array.from(new Set([...(master.linkedComplaints || []).map(id => id.toString()), ...filteredChildIds]));
    master.linkedDuplicateCount = master.linkedComplaints.length;

    master.timeline.push({
      status: master.status,
      message: `Maintenance Admin merged ${filteredChildIds.length} related complaints into this Master Incident.`,
      actionBy: req.user.id,
      timestamp: new Date()
    });

    await master.save();

    // Update child complaints
    await Complaint.updateMany(
      { _id: { $in: filteredChildIds } },
      {
        $set: {
          masterIncidentId: master._id,
          status: 'Assigned',
          assignedTo: master.assignedTo || null,
          priority: master.priority
        },
        $push: {
          timeline: {
            status: 'Assigned',
            message: `Merged into Master Incident #${master.complaintNumber}. Will be resolved together with primary work order.`,
            actionBy: req.user.id,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      msg: `Successfully merged ${filteredChildIds.length} tickets into Master Incident #${master.complaintNumber}`,
      master
    });
  } catch (err) {
    console.error('Merge master incident error:', err.message);
    res.status(500).json({ msg: 'Failed to merge complaints into Master Incident' });
  }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin only
router.get('/users', [auth, adminOnly], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

module.exports = router;
