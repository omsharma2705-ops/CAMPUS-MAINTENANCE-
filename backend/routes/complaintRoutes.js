const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');
const aiService = require('../services/aiService');
const { sendNotification } = require('../services/notificationService');

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const MaterialRequest = require('../models/MaterialRequest');

// Helper to generate unique complaint number
const generateComplaintNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${dateStr}-${randomSuffix}`;
};

// Helper to generate unique work order number
const generateWorkOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WO-${dateStr}-${randomSuffix}`;
};

// SLA turnaround hours by priority
const SLA_HOURS_MAP = {
  Urgent: 2,     // 2 Hours
  Emergency: 2,  // Alias
  High: 6,       // 6 Hours
  Medium: 24,    // 24 Hours
  Low: 48        // 48 Hours
};

// @route   POST api/complaints/ai-vision
// @desc    AI Computer Vision Image Scanner: Analyzes uploaded photo to detect defect & auto-populate form
// @access  Private
router.post('/ai-vision', [auth, upload.single('image')], async (req, res) => {
  try {
    const file = req.file;
    const { customHint } = req.body;

    const visionResult = aiService.analyzeImageVision(file, customHint || '');

    res.json({
      imageUrl: file ? file.path : '',
      visionResult,
    });
  } catch (err) {
    console.error('AI Vision error:', err.message);
    res.status(500).json({ msg: 'AI Vision analysis failed' });
  }
});

// @route   POST api/complaints/ai-analyze
// @desc    Real-time AI analysis for category auto-detection & duplicate check
// @access  Private
router.post('/ai-analyze', auth, async (req, res) => {
  try {
    const { title, description, department, category } = req.body;

    const aiClassification = aiService.detectCategoryAndPriority(title, description);

    const activeComplaints = await Complaint.find({
      status: { $in: ['Registered', 'Pending', 'Assigned', 'In Progress', 'Awaiting Materials'] }
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
// @desc    Student/Staff lodges a complaint
// @access  Private
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      priority = 'Medium', 
      department, 
      building,
      floor,
      room,
      lat, 
      lng, 
      locationDescription,
      isAiCategorized,
      aiConfidence,
    } = req.body;
    
    if (!description || !description.trim()) {
      return res.status(400).json({ msg: 'Description is mandatory.' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }

    const complaintNumber = generateComplaintNumber();
    const effectiveBuilding = building || department || 'General Campus';
    const effectiveCategory = category || 'Other';

    // Check for Recurring Issue in this location & category
    const pastLocationComplaints = await Complaint.countDocuments({
      'location.building': effectiveBuilding,
      category: effectiveCategory,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // past 30 days
    });

    const isRecurring = pastLocationComplaints >= 1;

    const newComplaint = new Complaint({
      complaintNumber,
      user: req.user.id,
      title: title || `${effectiveCategory} issue reported at ${effectiveBuilding}`,
      description,
      category: effectiveCategory,
      priority: priority || 'Medium',
      department: effectiveBuilding,
      status: 'Registered', // Initial status
      location: {
        building: effectiveBuilding,
        floor: floor || 'Ground Floor',
        room: room || 'General Area',
        lat: parseFloat(lat) || 28.6139,
        lng: parseFloat(lng) || 77.2090,
        description: locationDescription || ''
      },
      imageUrl,
      isAiCategorized: isAiCategorized === 'true' || isAiCategorized === true,
      aiConfidence: parseFloat(aiConfidence) || 0,
      upvotes: [req.user.id],
      isRecurring,
      recurringCount: pastLocationComplaints + 1,
      timeline: [
        {
          status: 'Registered',
          message: `Complaint #${complaintNumber} registered by ${req.user.name || 'User'}` + 
            (isAiCategorized ? ' (🤖 Categorized by Campus AI)' : '') +
            (isRecurring ? ` [🔁 Recurring Hotspot: ${pastLocationComplaints + 1}th occurrence in 30 days]` : ''),
          actionBy: req.user.id,
          timestamp: new Date(),
        }
      ]
    });

    const complaint = await newComplaint.save();

    // Notify Complainant with Confirmation (In-App, Email, SMS)
    await sendNotification({
      recipientId: req.user.id,
      title: `Complaint Registered #${complaintNumber}`,
      message: `Your maintenance complaint "${complaint.title}" has been registered in the system. Location: ${complaint.location.building}, Floor: ${complaint.location.floor}, Room: ${complaint.location.room}.`,
      type: 'Registration',
      complaint: complaint._id,
      complaintNumber: complaint.complaintNumber,
    });

    res.json(complaint);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ msg: 'Server error while submitting complaint' });
  }
});

// @route   POST api/complaints/:id/upvote
// @desc    Upvote an active issue
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const hasUpvoted = complaint.upvotes.some(uid => uid.toString() === req.user.id);

    if (hasUpvoted) {
      complaint.upvotes = complaint.upvotes.filter(uid => uid.toString() !== req.user.id);
    } else {
      complaint.upvotes.push(req.user.id);

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
      msg: hasUpvoted ? 'Upvote removed' : 'Upvoted successfully!',
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
        { complaintNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { 'location.building': { $regex: search, $options: 'i' } },
        { 'location.room': { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('user', ['name', 'email', 'department', 'phone', 'cardId'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone', 'trade'])
      .populate('materialRequests')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching complaints' });
  }
});

// @route   GET api/complaints/:id
// @desc    Get single complaint details with full timeline & material requests
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', ['name', 'email', 'department', 'phone', 'cardId'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone', 'trade'])
      .populate({
        path: 'materialRequests',
        populate: { path: 'requestedBy', select: 'name trade' }
      })
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

// @route   POST api/complaints/:id/work-order (and alias PUT api/complaints/:id/assign)
// @desc    Maintenance Manager creates a Work Order, assigns tradesman, sets SLA timer
// @access  Admin only
const handleWorkOrderCreation = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ msg: 'Only Maintenance Managers can create work orders & assign tradesmen.' });
    }

    const { workerId, priority, adminRemarks, instructions, tradesmanType } = req.body;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ msg: 'Selected user is not a valid maintenance tradesman.' });
    }

    const effectivePriority = priority || complaint.priority || 'Medium';
    const slaHours = SLA_HOURS_MAP[effectivePriority] || 24;
    const assignedAt = new Date();
    const slaDeadline = new Date(assignedAt.getTime() + slaHours * 3600000);
    const workOrderNumber = complaint.workOrder?.workOrderNumber || generateWorkOrderNumber();

    complaint.assignedTo = workerId;
    complaint.priority = effectivePriority;
    complaint.status = 'Assigned';
    if (adminRemarks) complaint.adminRemarks = adminRemarks;

    complaint.workOrder = {
      workOrderNumber,
      assignedAt,
      slaHours,
      slaDeadline,
      slaBreached: false,
      instructions: instructions || adminRemarks || 'Address issue within SLA window.',
      tradesmanType: tradesmanType || worker.trade || 'General Maintenance',
    };

    complaint.timeline.push({
      status: 'Assigned',
      message: `Work Order #${workOrderNumber} issued. Assigned to tradesman ${worker.name} (${worker.trade || worker.department || 'Maintenance'}). SLA: ${slaHours}h target deadline.`,
      actionBy: req.user.id,
      timestamp: assignedAt,
    });

    complaint.updatedAt = new Date();
    await complaint.save();

    // 1. Notify Tradesman
    await sendNotification({
      recipientId: worker._id,
      title: `New Work Order #${workOrderNumber}`,
      message: `You have been assigned to Complaint #${complaint.complaintNumber} (${complaint.category}) at ${complaint.location.building}, Floor ${complaint.location.floor}, Room ${complaint.location.room}. Priority: ${effectivePriority} (${slaHours}h SLA).`,
      type: 'Assignment',
      complaint: complaint._id,
      complaintNumber: complaint.complaintNumber,
    });

    // 2. Notify Complainant (In-App, Email, SMS)
    await sendNotification({
      recipientId: complaint.user,
      title: `Work Order Assigned #${workOrderNumber}`,
      message: `Your complaint #${complaint.complaintNumber} has been assigned to technician ${worker.name} (${worker.trade || 'Specialist'}). Priority: ${effectivePriority}. Resolution SLA: ${slaHours} hours.`,
      type: 'Assignment',
      complaint: complaint._id,
      complaintNumber: complaint.complaintNumber,
    });

    const populated = await Complaint.findById(complaint._id)
      .populate('user', ['name', 'email', 'cardId'])
      .populate('assignedTo', ['name', 'email', 'department', 'phone', 'trade']);

    res.json(populated);
  } catch (err) {
    console.error('Work order creation error:', err.message);
    res.status(500).json({ msg: 'Failed to create work order' });
  }
};

router.post('/:id/work-order', auth, handleWorkOrderCreation);
router.put('/:id/assign', auth, handleWorkOrderCreation);

// @route   POST api/complaints/:id/materials/request
// @desc    Tradesman submits required spare parts/materials requisition to Stores
// @access  Private (Assigned Worker)
router.post('/:id/materials/request', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    if (user.role === 'worker' && complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not assigned to this work order.' });
    }

    const { items, reason } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ msg: 'Please provide at least one required material item.' });
    }

    const materialRequest = new MaterialRequest({
      complaint: complaint._id,
      complaintNumber: complaint.complaintNumber,
      workOrderNumber: complaint.workOrder?.workOrderNumber || '',
      requestedBy: req.user.id,
      items: items.map(it => ({
        item: it.item || it.itemId || null,
        itemName: it.itemName || it.name,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'pcs'
      })),
      reason: reason || 'Required for repair/replacement work',
      status: 'Pending'
    });

    await materialRequest.save();

    complaint.materialRequests.push(materialRequest._id);
    complaint.status = 'Awaiting Materials';
    complaint.timeline.push({
      status: 'Awaiting Materials',
      message: `Tradesman ${user.name} submitted requisition for ${items.length} material(s) from Stores: ${items.map(i => `${i.quantity} ${i.unit || 'pcs'} ${i.itemName || i.name}`).join(', ')}.`,
      actionBy: req.user.id,
      timestamp: new Date(),
    });

    complaint.updatedAt = new Date();
    await complaint.save();

    // Notify Maintenance Managers / Stores
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendNotification({
        recipientId: admin._id,
        title: `Material Requisition for Work Order #${complaint.workOrder?.workOrderNumber || complaint.complaintNumber}`,
        message: `Tradesman ${user.name} requested materials for ${complaint.category} repair at ${complaint.location.building}. Requisition awaits store approval.`,
        type: 'Material',
        complaint: complaint._id,
        complaintNumber: complaint.complaintNumber,
      });
    }

    res.json({ msg: 'Material requisition sent to Stores', materialRequest, complaint });
  } catch (err) {
    console.error('Material request error:', err.message);
    res.status(500).json({ msg: 'Failed to submit material request' });
  }
});

// @route   PUT api/complaints/:id/status
// @desc    Worker updates work status & uploads before/after photos
// @access  Private (Assigned Worker or Admin)
router.put('/:id/status', [
  auth, 
  upload.fields([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'resolutionImage', maxCount: 1 }
  ])
], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    if (user.role === 'worker' && complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not assigned to this complaint.' });
    }

    const { status, workerRemarks } = req.body;

    if (workerRemarks) {
      complaint.workerRemarks = workerRemarks;
    }

    if (req.files?.beforeImage) {
      complaint.beforeImageUrl = req.files.beforeImage[0].path;
    }

    if (req.files?.resolutionImage) {
      complaint.resolutionImageUrl = req.files.resolutionImage[0].path;
    }

    if (status) {
      complaint.status = status;
      let timelineMsg = `Technician updated status to ${status}`;

      if (status === 'In Progress') {
        timelineMsg = `Tradesman ${user.name} started active repair work on site.`;
      } else if (status === 'Resolved' || status === 'Work Completed') {
        complaint.status = 'Resolved';
        complaint.resolvedAt = new Date();
        
        // Check SLA compliance
        if (complaint.workOrder?.slaDeadline) {
          const isBreached = complaint.resolvedAt > new Date(complaint.workOrder.slaDeadline);
          complaint.workOrder.slaBreached = isBreached;
        }

        timelineMsg = `Tradesman ${user.name} marked work as completed and submitted resolution proof. Awaiting manager inspection.`;

        // Notify Maintenance Managers to verify work
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await sendNotification({
            recipientId: admin._id,
            title: `Work Completed: #${complaint.complaintNumber}`,
            message: `Tradesman ${user.name} completed work on #${complaint.complaintNumber} (${complaint.title}). Please inspect proof and verify completion.`,
            type: 'Completion',
            complaint: complaint._id,
            complaintNumber: complaint.complaintNumber,
          });
        }
        // Auto-resolve any linked complaints if this was a master incident
        if (complaint.isMasterIncident && complaint.linkedComplaints?.length > 0) {
          try {
            await Complaint.updateMany(
              { _id: { $in: complaint.linkedComplaints } },
              {
                $set: {
                  status: 'Resolved',
                  resolvedAt: new Date(),
                  resolutionImageUrl: complaint.resolutionImageUrl || '',
                  workerRemarks: `Resolved via Master Incident #${complaint.complaintNumber}: ${workerRemarks || 'Repairs completed on site.'}`
                },
                $push: {
                  timeline: {
                    status: 'Resolved',
                    message: `Repairs successfully completed under Master Incident #${complaint.complaintNumber} by ${user.name}.`,
                    actionBy: req.user.id,
                    timestamp: new Date()
                  }
                }
              }
            );

            // Notify all subscribers of linked complaints
            if (complaint.subscribers?.length > 0) {
              for (const subId of complaint.subscribers) {
                await sendNotification({
                  recipientId: subId,
                  title: `Master Incident #${complaint.complaintNumber} Resolved!`,
                  message: `The reported maintenance issue at ${complaint.location.building} has been resolved by technician ${user.name}.`,
                  type: 'Completion',
                  complaint: complaint._id,
                  complaintNumber: complaint.complaintNumber
                });
              }
            }
          } catch (linkErr) {
            console.error('Error auto-resolving linked complaints:', linkErr.message);
          }
        }
      }

      complaint.timeline.push({
        status: complaint.status,
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
// @desc    Maintenance Manager verifies resolution and marks complaint as Completed
// @access  Admin only
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Super Admin / Maintenance Manager privileges required.' });
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
      complaint.status = 'Completed'; // Completed & verified
      complaint.closedAt = new Date();
      complaint.timeline.push({
        status: 'Completed',
        message: `Maintenance Manager verified work resolution and marked ticket as Completed.${adminRemarks ? ' Remarks: ' + adminRemarks : ''}`,
        actionBy: req.user.id,
        timestamp: new Date(),
      });

      // Dispatch Multi-Channel Completion Notification to Complainant
      await sendNotification({
        recipientId: complaint.user,
        title: `Work Verified & Completed #${complaint.complaintNumber}`,
        message: `Your complaint #${complaint.complaintNumber} (${complaint.title}) has been resolved and verified by the Maintenance Manager. Please rate the service and share your feedback.`,
        type: 'Completion',
        complaint: complaint._id,
        complaintNumber: complaint.complaintNumber,
      });

    } else {
      complaint.status = 'In Progress';
      complaint.timeline.push({
        status: 'In Progress',
        message: `Manager requested rework / rejected resolution: "${adminRemarks || 'Please review repair quality'}".`,
        actionBy: req.user.id,
        timestamp: new Date(),
      });

      // Notify Tradesman of rework
      if (complaint.assignedTo) {
        await sendNotification({
          recipientId: complaint.assignedTo,
          title: `Rework Requested: #${complaint.complaintNumber}`,
          message: `Manager requested rework on Complaint #${complaint.complaintNumber}. Reason: ${adminRemarks || 'Quality inspection failed. Please re-check.'}`,
          type: 'General',
          complaint: complaint._id,
          complaintNumber: complaint.complaintNumber,
        });
      }
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
// @desc    Student gives rating and review on completed complaint
// @access  Private
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
      message: `Complainant submitted ${rating} ⭐ feedback: "${comment || 'Satisfied with resolution'}"`,
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

// @route   POST api/complaints/:id/link-duplicate
// @desc    Student links their issue to an existing complaint (Me Too / Group Master Incident)
// @access  Private
router.post('/:id/link-duplicate', auth, async (req, res) => {
  try {
    const masterComplaint = await Complaint.findById(req.params.id);
    if (!masterComplaint) {
      return res.status(404).json({ msg: 'Complaint not found' });
    }

    const userId = req.user.id;
    const studentUser = await User.findById(userId);

    const alreadySubscribed = masterComplaint.subscribers?.some(s => s.toString() === userId) ||
      masterComplaint.upvotes?.some(u => u.toString() === userId);

    if (!alreadySubscribed) {
      if (!masterComplaint.subscribers) masterComplaint.subscribers = [];
      if (!masterComplaint.upvotes) masterComplaint.upvotes = [];

      masterComplaint.subscribers.push(userId);
      masterComplaint.upvotes.push(userId);
      masterComplaint.linkedDuplicateCount = (masterComplaint.linkedDuplicateCount || 0) + 1;
      masterComplaint.isMasterIncident = true;

      // Auto-escalate to High priority if 3 or more students report
      if (masterComplaint.linkedDuplicateCount >= 3 && (masterComplaint.priority === 'Low' || masterComplaint.priority === 'Medium')) {
        masterComplaint.priority = 'High';
        masterComplaint.timeline.push({
          status: masterComplaint.status,
          message: `🔥 Priority auto-escalated to HIGH due to multiple scholar reports (${masterComplaint.linkedDuplicateCount + 1} affected students).`,
          actionBy: userId,
          timestamp: new Date()
        });
      } else {
        masterComplaint.timeline.push({
          status: masterComplaint.status,
          message: `Scholar ${studentUser?.name || 'Student'} reported also facing this issue (+1 Affected). Total impacted: ${masterComplaint.linkedDuplicateCount + 1}`,
          actionBy: userId,
          timestamp: new Date()
        });
      }

      await masterComplaint.save();

      await sendNotification({
        recipientId: userId,
        title: `Tracking Incident #${masterComplaint.complaintNumber}`,
        message: `You are now tracking #${masterComplaint.complaintNumber} (${masterComplaint.category} at ${masterComplaint.location?.building || masterComplaint.department}). You will receive live status updates.`,
        type: 'General',
        complaint: masterComplaint._id,
        complaintNumber: masterComplaint.complaintNumber
      });
    }

    res.json({
      msg: 'Successfully linked to Master Incident! You will receive live updates when resolved.',
      masterComplaint
    });
  } catch (err) {
    console.error('Link duplicate error:', err.message);
    res.status(500).json({ msg: 'Failed to link duplicate complaint' });
  }
});

module.exports = router;
