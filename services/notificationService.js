// services/notificationService.js
const Notification = require("../models/notification");

async function sendNotification({ userId, message, link }, io) {
  if (!userId || !message) {
    console.warn("❌ Missing userId or message");
    return;
  }

  const notification = new Notification({
    user: userId,
    message,
    link,
  });

  await notification.save();

  if (io) {
    io.to(userId).emit("notification", notification);
  }

  return notification;
}

module.exports = { sendNotification };
