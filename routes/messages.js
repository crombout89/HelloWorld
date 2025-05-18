const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const User = require("../models/user");
const Notification = require("../models/notification");
const { areFriends, getFriendsForUser } = require("../services/friendService");
const { translateText } = require("../services/translate");

// 🔐 Middleware to confirm login
function isAuthenticated(req, res, next) {
  if (!req.session?.userId) return res.redirect("/login");
  next();
}

/* ===========================
   📥 GET: Inbox (list of conversations)
   =========================== */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.userId;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    });

    const userIds = new Set();
    messages.forEach((msg) => {
      userIds.add(
        msg.sender.toString() === currentUserId
          ? msg.recipient.toString()
          : msg.sender.toString()
      );
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } });

    const friends = await getFriendsForUser(req.session.userId);
    res.render("messages/inbox", {
      title: "Your Messages",
      users,
      friends,
    });
  } catch (err) {
    console.error("Error loading inbox:", err);
    res.redirect("/dashboard");
  }
});

/* ===========================
   🆕 POST: Start a new DM
   =========================== */
router.post("/start", isAuthenticated, async (req, res) => {
  const currentUserId = req.session.userId;
  const friendId = req.body.friendId;

  if (!friendId || friendId === currentUserId) {
    return res.redirect("/messages");
  }

  res.redirect(`/messages/${friendId}`);
});

/* ===========================
   💬 GET: View chat with specific user
   =========================== */
router.get("/:userId", isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    const otherUser = await User.findById(otherUserId);
    const currentUser = await User.findById(currentUserId);

    res.render("messages/chat", {
      title: `Chat with ${otherUser?.username || "User"}`,
      messages,
      otherUser,
      user: req.user,
      targetLanguage: currentUser?.profile?.language || "en",
    });
  } catch (err) {
    console.error("Error loading chat:", err);
    res.redirect("/dashboard");
  }
});

/* ===========================
   📤 POST: Send new message
   =========================== */
router.post("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    const sender = req.session.userId;
    const recipient = req.params.userId;

    if (!text || !text.trim()) return res.redirect(`/messages/${recipient}`);

    const message = await Message.create({ sender, recipient, text });

    const notification = new Notification({
      user: recipient,
      message: `${req.user?.username || "Someone"} sent you a message!`,
      link: `/messages/${sender}`,
      meta: {
        type: "new_message",
        from: sender,
      },
    });

    await notification.save();

    const io = req.app.get("io");
    io.to(recipient).emit("notification", notification);

    res.redirect(`/messages/${recipient}`);
  } catch (err) {
    console.error("Error sending message:", err);
    res.redirect(`/messages/${req.params.userId}`);
  }
});

/* ===========================
   🌍 POST: Translate a message
   =========================== */
router.post("/:userId/translate", isAuthenticated, async (req, res) => {
  const { text, messageId } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    const to = user?.profile?.language || "fr";
    const from = "en";

    const translated = await translateText(text, from, to);
    if (!translated) {
      return res.status(500).json({ error: "Translation failed" });
    }

    // 🔄 Save translation to the DB
    await Message.findByIdAndUpdate(messageId, {
      translatedText: translated,
    });

    res.json({ translated });
  } catch (err) {
    console.error("Translation route error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
