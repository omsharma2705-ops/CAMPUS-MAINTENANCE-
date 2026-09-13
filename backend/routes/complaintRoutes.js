const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');
const aiService = require('../services/aiService');

const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @route   POST api/complaints/ai-analyze
// @desc    Real-time AI analysis for category auto-detection & duplicate check
// @access  Private
router.post('/ai-analyze', auth, async (req, res) => {
  try {
    const { title, description, department, category } = req.body;

    // 1. AI Category & Priority Detection
    const aiClassification = aiService.detectCategoryAndPriority(title, description);

    // 2. AI Duplicate Detection against Active Complaints (Pending, Assigned, In Progress)
    const activeComplaints = await Complaint.find({
      status: { $in: ['Pending', 'Assigned', 'In Progress'] }
    })
      .populate('user', ['name', 'department'])
      .populate('assignedTo', ['name'])
      .sort({ createdAt: -1 })
      .limit(30);

    const duplicateMatches = aiService.detectDuplicates(
      {
        title: title || '',
        description: description || '',
        category: category || aiClassification.category,
        department: department || ''
      },
      activeComplaints
    );

    res.json({
      aiClassification,
      duplicateMatches,
      hasDuplicates: duplicateMatches.length > 0
    });
  } catch (err) {
    console.error('AI Analysis Error:', err.message);
    res.status(500).json({ msg: 'AI analysis failed' });
  }
});

// @route   POST api/complaints
// @desc    Student/Staff creates a complaint
// @access  Private
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      priority, 
      department, 
      lat, 
      lng, 
      locationDescription,
      isAiCategorized,
      aiConfidence 
    } = req.body;
    
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
      isAiCategorized: isAiCategorized === 'true' || isAiCategorized === true,
      aiConfidence: parseFloat(aiConfidence) || 0,
      upvotes: [req.user.id], // Creator automatically upvotes their ticket
      timeline: [
        {
          status: 'Pending',
          message: 'Complaint lodged by ' + (req.user.name || 'User') + (isAiCategorized ? ' (🤖 Categorized by Campus AI)' : ''),
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

// @route   POST api/complaints/:id/upvote
// @desc    Upvote / Add voice to an existing active issue (Duplicate avoidance)
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    // Check if user already upvoted
    const hasUpvoted = complaint.upvotes.some(uid => uid.toString() === req.user.id);

    if (hasUpvoted) {
      // Remove upvote (toggle)
      complaint.upvotes = complaint.upvotes.filter(uid => uid.toString() !== req.user.id);
    } else {
      complaint.upvotes.push(req.user.id);

      // If upvotes > 3, auto-boost priority to High/Emergency
      if (complaint.upvotes.length >= 4 && complaint.priority === 'Medium') {
        complaint.priority = 'High';
        complaint.timeline.push({
          status: complaint.status,
          message: `🔥 Priority auto-boosted to High due to community upvotes (${complaint.upvotes.length} students impacted).`,
          actionBy: req.user.id,
          timestamp: new Date(),
        });
      }
    }

    await complaint.save();
    res.json({
      msg: hasUpvoted ? 'Upvote removed' : 'Upvoted successfully! Impact recorded.',
      upvotesCount: complaint.upvotes.length,
      hasUpvoted: !hasUpvoted,
      priority: complaint.priority
    });
  } catch (err) {
    console.error('Upvote error:', err.message);
    res.status(500).json({ msg: 'Failed to record upvote' });
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
      // If student passes ?mine=true or default
      query.user = req.user.id;
    } else if (user.role === 'worker') {
      query.assignedTo = req.user.id;
    }

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
// @desc    Worker updates status (e.g. In Progress, or Resolved with proof photo)
// @access  Private (Worker)
router.put('/:id/status', [auth, upload.single('resolutionImage')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const { status, workerRemarks } = req.body;

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
// @desc    Admin verifies resolution and closes the complaint
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
// @desc    Student gives rating and review on closed complaint
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
