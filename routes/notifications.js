const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// 🔔 Create a new notification
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { userId, message, link } = req.body;

    const notification = new Notification({
      user: userId,
      message,
      link
    });

    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error('Notification creation error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// 📬 Fetch all notifications for the logged-in user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

    res.render('notifications', {
      title: 'Your Notifications',
      notifications
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).send('Error loading notifications');
  }
});

module.exports = router;