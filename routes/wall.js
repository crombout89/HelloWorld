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

router.post("/wall/delete/:postId", isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const post = await WallPost.findById(req.params.postId).populate(
      "recipient"
    );

    if (!post) return res.status(404).send("Post not found");

    const canDelete =
      post.author.toString() === userId ||
      post.recipient._id.toString() === userId;

    if (!canDelete) return res.status(403).send("Not authorized");

    await WallPost.findByIdAndDelete(req.params.postId);
    res.redirect(`/u/${post.recipient.username}`);
  } catch (err) {
    console.error("Delete wall post error:", err);
    res.status(500).send("Could not delete wall post");
  }
});

module.exports = router;
