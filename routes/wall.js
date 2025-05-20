const express = require("express");
const router = express.Router();
const WallPost = require("../models/wallPost");
const { sendNotification } = require("../services/notificationService");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");

// POST: Make a new wall post
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

    const author = await User.findById(req.session.userId).lean();

    if (recipientId !== req.session.userId) {
      await sendNotification(
        {
          userId: recipientId,
          message: `${author.username} posted on your wall.`,
          link: `/u/${recipientUsername}`,
          meta: { type: "wall_post" },
        },
        req.app.get("io")
      );
    }

    res.redirect(`/u/${recipientUsername}`);
  } catch (err) {
    console.error("Wall post error:", err);
    res.status(500).send("Wall post failed");
  }
});

// POST: Delete a wall post
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

// POST: React to a wall post
router.post("/wall/react/:postId", isLoggedIn, async (req, res) => {
  const { type } = req.body;
  const userId = req.session.userId;

  const validTypes = ["like", "love", "laugh", "wow", "sad", "dislike"];
  if (!validTypes.includes(type)) {
    return res.status(400).send("Invalid reaction type");
  }

  const post = await WallPost.findById(req.params.postId).populate("recipient");
  if (!post) return res.status(404).send("Post not found");

  // Remove any previous reaction from this user
  post.reactions = post.reactions.filter((r) => r.user.toString() !== userId);

  // Add the new reaction
  post.reactions.push({ user: userId, type });
  await post.save();

  // 🔔 Notification logic (failsafe + log)
  const recipientId = post.recipient?._id?.toString();

  if (!recipientId) {
    console.warn("⚠️ No recipient found on wall post.");
  } else if (recipientId === userId) {
    console.log("🛑 Reaction by wall owner — no notification sent.");
  } else {
    const author = await User.findById(userId).lean();
    console.log("📣 Sending notification to:", post.recipient.username);

    await sendNotification(
      {
        userId: post.recipient._id,
        message: `${author.username} reacted to a post on your wall.`,
        link: `/u/${post.recipient.username}`,
        meta: { type: "wall_post_reaction" },
      },
      req.app.get("io")
    );
  }

  res.redirect(`/u/${post.recipient.username}`);
});

module.exports = router;
