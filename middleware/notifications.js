const Notification = require("../models/notification");

module.exports = async function injectNotifications(req, res, next) {
  if (!req.session?.userId) return next();
  try {
    const notifications = await Notification.find({
      user: req.session.userId,
    }).lean();
    res.locals.notifications = notifications;
  } catch (err) {
    console.error("🔔 Notification middleware error:", err);
    res.locals.notifications = [];
  }
  next();
};
