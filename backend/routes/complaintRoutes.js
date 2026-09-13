const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @route   POST api/complaints
// @desc    Student/Staff creates a complaint
// @access  Private (student/staff/admin)
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { title, description, category, priority, department, lat, lng, locationDescription } = req.body;
    
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }

    const newComplaint = new Complaint({
      user: req.user.id,
      title,
      description,
      category,
      priority: priority || 'Medium',
      department: department || 'General Campus',
      location: {
        lat: parseFloat(lat) || 28.6139,
        lng: parseFloat(lng) || 77.2090,
        description: locationDescription || ''
      },
      imageUrl,
      timeline: [
        {
          status: 'Pending',
          message: 'Complaint lodged by ' + (req.user.name || 'User'),
          actionBy: req.user.id,
          timestamp: new Date(),
        }
      ]
    });

    const complaint = await newComplaint.save();
    res.json(complaint);
  } catch (err) {
    console.error('Create complaint error:', err.message);
    res.status(500).json({ msg: 'Server error while submitting complaint' });
  }
});

// @route   GET api/complaints
// @desc    Get complaints with multi-filter (Role-aware)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { status, category, priority, search } = req.query;

    let query = {};

    if (user.role === 'student') {
      query.user = req.user.id;
    } else if (user.role === 'worker') {
      query.assignedTo = req.user.id;
    }
    // admin gets all complaints

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('user', ['name', 'email', 'department', 'phone'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone'])
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching complaints' });
  }
});

// @route   GET api/complaints/:id
// @desc    Get single complaint details with full timeline
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', ['name', 'email', 'department', 'phone'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone'])
      .populate('timeline.actionBy', ['name', 'role']);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    console.error('Get single complaint error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/complaints/:id/assign
// @desc    Admin assigns complaint to worker and sets priority
// @access  Admin only
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ msg: 'Only Super Admins can assign complaints.' });
    }

    const { workerId, priority, adminRemarks } = req.body;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ msg: 'Selected user is not a valid maintenance worker' });
    }

    complaint.assignedTo = workerId;
    complaint.status = 'Assigned';
    if (priority) complaint.priority = priority;
    if (adminRemarks) complaint.adminRemarks = adminRemarks;

    complaint.timeline.push({
      status: 'Assigned',
      message: `Assigned to technician ${worker.name} (${worker.department || 'Maintenance'}) by Admin`,
      actionBy: req.user.id,
      timestamp: new Date(),
    });

    complaint.updatedAt = new Date();
    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('user', ['name', 'email'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone']);

    res.json(populated);
  } catch (err) {
    console.error('Assign complaint error:', err.message);
    res.status(500).json({ msg: 'Failed to assign complaint' });
  }
});

// @route   PUT api/complaints/:id/status
// @desc    Worker updates status (e.g., 'In Progress', or 'Resolved' with resolution proof photo)
// @access  Private (Worker)
router.put('/:id/status', [auth, upload.single('resolutionImage')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const { status, workerRemarks } = req.body;

    // Worker authorization check
    if (user.role === 'worker' && complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not assigned to this complaint.' });
    }

    if (workerRemarks) {
      complaint.workerRemarks = workerRemarks;
    }

    if (req.file) {
      complaint.resolutionImageUrl = req.file.path;
    }

    if (status) {
      complaint.status = status;
      let timelineMsg = `Technician updated status to ${status}`;

      if (status === 'In Progress') {
        timelineMsg = `Technician ${user.name} started work on this issue.`;
      } else if (status === 'Resolved') {
        timelineMsg = `Technician ${user.name} marked work as completed and submitted resolution proof.`;
        complaint.resolvedAt = new Date();
      }

      complaint.timeline.push({
        status,
        message: timelineMsg + (workerRemarks ? ` Remarks: "${workerRemarks}"` : ''),
        actionBy: req.user.id,
        timestamp: new Date(),
      });
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    res.json(complaint);
  } catch (err) {
    console.error('Worker status update error:', err.message);
    res.status(500).json({ msg: 'Failed to update status' });
  }
});

// @route   PUT api/complaints/:id/verify
// @desc    Admin verifies resolution and closes the complaint (or reopens)
// @access  Admin only
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Super Admin privileges required.' });
    }

    const { isApproved, adminRemarks } = req.body;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    if (adminRemarks) {
      complaint.adminRemarks = adminRemarks;
    }

    if (isApproved) {
      complaint.status = 'Closed';
      complaint.closedAt = new Date();
      complaint.timeline.push({
        status: 'Closed',
        message: `Admin verified resolution proof and marked ticket as Closed.${adminRemarks ? ' Notes: ' + adminRemarks : ''}`,
        actionBy: req.user.id,
        timestamp: new Date(),
      });
    } else {
      // Reopen back to In Progress
      complaint.status = 'In Progress';
      complaint.timeline.push({
        status: 'In Progress',
        message: `Admin requested rework / rejected resolution proof: "${adminRemarks || 'Please review repair'}".`,
        actionBy: req.user.id,
        timestamp: new Date(),
      });
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    res.json(complaint);
  } catch (err) {
    console.error('Admin verify error:', err.message);
    res.status(500).json({ msg: 'Failed to verify complaint' });
  }
});

// @route   POST api/complaints/:id/feedback
// @desc    Student gives 1-5 star rating and review on closed complaint
// @access  Private (Complaint Owner)
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    if (complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the complaint creator can submit feedback.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Please provide a valid rating between 1 and 5 stars.' });
    }

    complaint.feedback = {
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date(),
    };

    complaint.timeline.push({
      status: 'Feedback Received',
      message: `Student submitted ${rating} ⭐ feedback: "${comment || 'No comments'}"`,
      actionBy: req.user.id,
      timestamp: new Date(),
    });

    complaint.updatedAt = new Date();
    await complaint.save();

    res.json(complaint);
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ msg: 'Failed to submit feedback' });
  }
});

module.exports = router;
