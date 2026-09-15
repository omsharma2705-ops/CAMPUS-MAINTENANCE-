const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// @route   GET api/notifications
// @desc    Get logged in user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Notifications fetch error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch notifications' });
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ msg: 'Error updating notification' });
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id }, { isRead: true });
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Error marking all as read' });
  }
});

// @route   GET api/notifications/logs
// @desc    Get multi-channel dispatch logs (Email & SMS audit)
// @access  Private
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await Notification.find()
      .populate('recipient', ['name', 'email', 'phone', 'role', 'cardId'])
      .sort({ createdAt: -1 })
      .limit(60);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch dispatch logs' });
  }
});

module.exports = router;
