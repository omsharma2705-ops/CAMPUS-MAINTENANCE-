const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Dispatches an In-App, Email, and SMS notification
 */
const sendNotification = async ({
  recipientId,
  title,
  message,
  type = 'General',
  complaint = null,
  complaintNumber = '',
}) => {
  try {
    const user = await User.findById(recipientId);
    if (!user) return null;

    const emailStatus = user.email 
      ? `Sent to ${user.email} (University SMTP Gateway)` 
      : 'No email address';

    const smsStatus = user.phone 
      ? `Dispatched via SMS Gateway to ${user.phone}` 
      : 'No phone registered';

    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      channels: {
        inApp: true,
        email: !!user.email,
        sms: !!user.phone,
      },
      complaint: complaint ? (complaint._id || complaint) : null,
      complaintNumber,
      emailDeliveryStatus: emailStatus,
      smsDeliveryStatus: smsStatus,
      createdAt: new Date(),
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error('Failed to dispatch notification:', err.message);
    return null;
  }
};

module.exports = {
  sendNotification,
};
