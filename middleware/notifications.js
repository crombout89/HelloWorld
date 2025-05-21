const Notification = require("../models/notification");

module.exports = async function injectNotifications(req, res, next) {
  if (!req.session?.userId) {
    console.log("🔕 No session user, skipping notifications.");
    return next();
  }

  try {
    const notifications = await Notification.find({
      user: req.session.userId,
    }).lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.locals.notifications = notifications;
    res.locals.unreadNotifications = unreadCount;

    console.log(
      `🔔 Injected ${notifications.length} notifications for user ${req.session.userId}`
    );
  } catch (err) {
    console.error("🔔 Notification middleware error:", err);
    res.locals.notifications = [];
    res.locals.unreadNotifications = 0;
  }

  next();
};