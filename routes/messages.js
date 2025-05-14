const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');

// Middleware to check login
function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }
  next();
}

// 📥 Inbox or redirect to first user you’ve messaged
router.get('/messages', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.userId;

    // Find users you have exchanged messages with
    const messages = await Message.find({ $or: [{ sender: currentUserId }, { recipient: currentUserId }] });
    const userIds = new Set();

    messages.forEach(msg => {
      userIds.add(msg.sender.toString() === currentUserId ? msg.recipient.toString() : msg.sender.toString());
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } });

    res.render('messages-inbox', { title: 'Your Messages', users });
  } catch (err) {
    console.error('Error loading inbox:', err);
    res.redirect('/dashboard');
  }
});

// 💬 View conversation with a specific user
router.get('/messages/:userId', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    const otherUser = await User.findById(otherUserId);

    res.render('messages', {
      title: `Messages with ${otherUser?.username || 'User'}`,
      messages,
      otherUser
    });
  } catch (err) {
    console.error('Error loading messages:', err);
    res.redirect('/dashboard');
  }
});

// 📤 Send a new message
router.post('/messages/:userId', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    const sender = req.session.userId;
    const recipient = req.params.userId;

    if (!text || !text.trim()) {
      return res.redirect(`/messages/${recipient}`);
    }

    await Message.create({ sender, recipient, text });

    res.redirect(`/messages/${recipient}`);
  } catch (err) {
    console.error('Error sending message:', err);
    res.redirect(`/messages/${req.params.userId}`);
  }
});

module.exports = router;