const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

router.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notifications = await Notification.find({ user: req.session.userId })
    .sort({ createdAt: -1 })
    .lean();

  res.render("notifications", {
    title: "Your Notifications",
    notifications,
  });
});

router.post("/mark-read/:id", async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.redirect("back");
});

module.exports = router;
