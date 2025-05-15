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
router.post('/create', async (req, res) => {
  // Debug log to verify body is being received
  console.log('🧪 Raw POST body:', req.body);

  const { userId, message, link } = req.body;

  // Check for missing data
  if (!userId || !message) {
    console.warn('❗ Missing userId or message:', { userId, message });
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    const notification = new Notification({
      user: userId,
      message,
      link
    });

    await notification.save();

    const io = req.app.get('io');
    io.to(userId).emit('notification', notification); // send to specific user

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error('Notification creation error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// 📬 Fetch all notifications for the logged-in user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.render("notifications", {
      title: "Your Notifications",
      notifications,
      user: {
        ...req.session.user,
        _id: userId, // 👈 Needed for layout.ejs logic
      },
    });
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// ✅ Mark a single notification as read
router.post("/mark-read/:id", isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.userId;

    // Only mark if it belongs to this user
    await Notification.updateOne(
      { _id: notificationId, user: userId },
      { $set: { read: true } }
    );

    const redirect = req.body.redirect || "/notifications";
    res.redirect(redirect);
  } catch (err) {
    console.error("Mark read error:", err);
    res.redirect("/notifications");
  }
});

module.exports = router;