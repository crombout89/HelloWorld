const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

const isAuthenticated = async (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  next();
};

router.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notifications = await Notification.find({
    user: req.session.userId,
    read: false, // ✅ filter out read notifications
  })
    .sort({ createdAt: -1 })
    .lean();

  res.render("notifications", {
    title: "Your Notifications",
    notifications,
  });
});

// Mark a single notification as read
router.post("/read/:id", isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) return res.status(404).send("Notification not found");
    if (notification.user.toString() !== req.session.userId)
      return res.status(403).send("Not authorized");

    notification.read = true;
    await notification.save();

    res.redirect("/notifications");
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).send("Failed to mark as read");
  }
});

// Mark all notifications as read
router.post("/mark-all-read", isAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.session.userId, read: false },
      { $set: { read: true } }
    );
    res.redirect("/notifications");
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
