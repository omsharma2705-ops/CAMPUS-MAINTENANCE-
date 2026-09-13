const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// Admin role check middleware
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

// @route   GET api/admin/analytics
// @desc    Get comprehensive KPI dashboard metrics & charts
// @access  Admin only
router.get('/analytics', [auth, adminOnly], async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const closed = await Complaint.countDocuments({ status: 'Closed' });

    // Priorities
    const lowPriority = await Complaint.countDocuments({ priority: 'Low' });
    const mediumPriority = await Complaint.countDocuments({ priority: 'Medium' });
    const highPriority = await Complaint.countDocuments({ priority: 'High' });
    const emergencyPriority = await Complaint.countDocuments({ priority: 'Emergency' });

    // Category Breakdown Aggregation
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Department Breakdown Aggregation
    const departmentStats = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average Feedback Rating
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

    // Worker Performance
    const workerCount = await User.countDocuments({ role: 'worker' });
    const studentCount = await User.countDocuments({ role: 'student' });

    res.json({
      summary: {
        totalComplaints,
        pending,
        assigned,
        inProgress,
        resolved,
        closed,
        activeRate: totalComplaints ? Math.round(((closed + resolved) / totalComplaints) * 100) : 0,
        workerCount,
        studentCount,
        avgRating: feedbackStats.length > 0 ? Number(feedbackStats[0].avgRating.toFixed(1)) : 0,
        totalFeedbacks: feedbackStats.length > 0 ? feedbackStats[0].totalFeedbacks : 0,
      },
      priorities: {
        Low: lowPriority,
        Medium: mediumPriority,
        High: highPriority,
        Emergency: emergencyPriority,
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
// @desc    Get all maintenance staff members with their current active task load
// @access  Admin only
router.get('/workers', [auth, adminOnly], async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password').sort({ name: 1 });

    // Calculate active task count for each worker
    const workersWithLoad = await Promise.all(
      workers.map(async (w) => {
        const activeTasks = await Complaint.countDocuments({
          assignedTo: w._id,
          status: { $in: ['Assigned', 'In Progress'] }
        });
        const completedTasks = await Complaint.countDocuments({
          assignedTo: w._id,
          status: { $in: ['Resolved', 'Closed'] }
        });
        return {
          ...w.toObject(),
          activeTasks,
          completedTasks
        };
      })
    );

    res.json(workersWithLoad);
  } catch (err) {
    console.error('Error fetching workers:', err.message);
    res.status(500).json({ msg: 'Failed to fetch workers' });
  }
});

// @route   POST api/admin/workers
// @desc    Admin creates a new maintenance technician
// @access  Admin only
router.post('/workers', [auth, adminOnly], async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  try {
    let existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }

    const newWorker = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'worker',
      department: department || 'General Maintenance',
      phone: phone || '',
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
        role: newWorker.role,
      }
    });
  } catch (err) {
    console.error('Create worker error:', err.message);
    res.status(500).json({ msg: 'Failed to create worker account' });
  }
});

// @route   GET api/admin/users
// @desc    Get all users across roles (Student, Staff, Worker, Admin)
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
