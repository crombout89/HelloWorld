const express = require("express");
const router = express.Router();
const Friendship = require("../models/friendship");
const User = require("../models/user");

function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// 🔗 Send friend request
router.post("/request/:userId", isAuthenticated, async (req, res) => {
  try {
    const requester = req.session.userId;
    const recipient = req.params.userId;

    if (requester === recipient)
      return res.status(400).json({ error: "Cannot friend yourself." });

    const existing = await Friendship.findOne({
      $or: [
        { requester, recipient },
        { requester: recipient, recipient: requester },
      ],
    });

    if (existing)
      return res
        .status(409)
        .json({ error: "Friend request already exists or already friends." });

    const friendship = await Friendship.create({ requester, recipient });
    res.status(201).json({ message: "Friend request sent.", friendship });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send request." });
  }
});

// ✅ Accept friend request
router.post("/accept/:userId", isAuthenticated, async (req, res) => {
  try {
    const recipient = req.session.userId;
    const requester = req.params.userId;

    const friendship = await Friendship.findOneAndUpdate(
      { requester, recipient, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship)
      return res.status(404).json({ error: "No pending request found." });

    res.json({ message: "Friend request accepted.", friendship });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not accept request." });
  }
});

// ❌ Decline friend request
router.post("/decline/:userId", isAuthenticated, async (req, res) => {
  try {
    const recipient = req.session.userId;
    const requester = req.params.userId;

    const deleted = await Friendship.findOneAndDelete({
      requester,
      recipient,
      status: "pending",
    });

    if (!deleted)
      return res.status(404).json({ error: "No pending request found." });

    res.json({ message: "Friend request declined." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not decline request." });
  }
});

// 👥 List current friends
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    }).populate("requester recipient");

    const friends = friendships.map((f) =>
      f.requester._id.toString() === userId ? f.recipient : f.requester
    );

    res.render("friends", {
      title: "Your Friends",
      friends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch friends." });
  }
});

module.exports = router;