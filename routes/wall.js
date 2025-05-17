const express = require("express");
const router = express.Router();
const WallPost = require("../models/wallPost");
const { isLoggedIn } = require("../middleware/auth");

router.post("/wall/post", isLoggedIn, async (req, res) => {
  const { recipientId, message, recipientUsername } = req.body;
  try {
    if (!recipientId || !message.trim()) {
      return res.status(400).send("Missing recipient or message");
    }

    await WallPost.create({
      author: req.session.userId,
      recipient: recipientId,
      message: message.trim(),
    });

    res.redirect(`/u/${recipientUsername}`);
  } catch (err) {
    console.error("Wall post error:", err);
    res.status(500).send("Wall post failed");
  }
});

module.exports = router;
