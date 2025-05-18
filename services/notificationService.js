const Notification = require("../models/notification");

async function sendNotification({ userId, message, link, meta = {} }, io) {
  if (!userId || !message) return;

  const notification = new Notification({ user: userId, message, link, meta });
  await notification.save();

  if (io) io.to(userId.toString()).emit("notification", notification);
}

module.exports = { sendNotification };
