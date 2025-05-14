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

// ✅ Accept friend request by Friendship ID
router.post("/accept-request/:requestId", isAuthenticated, async (req, res) => {
  try {
    const friendship = await Friendship.findOneAndUpdate(
      { _id: req.params.requestId, recipient: req.session.userId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) return res.status(404).send("Request not found.");
    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).send("Failed to accept request.");
  }
});

// ❌ Decline friend request by Friendship ID
router.post("/decline-request/:requestId", isAuthenticated, async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      _id: req.params.requestId,
      recipient: req.session.userId,
      status: "pending",
    });

    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Error declining request:", err);
    res.status(500).send("Failed to decline request.");
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

// 📬 View pending friend requests
router.get("/requests", isAuthenticated, async (req, res) => {
  try {
    const recipient = req.session.userId;

    const pendingRequests = await Friendship.find({
      recipient,
      status: "pending",
    }).populate("requester");

    res.render("friend-requests", {
      title: "Pending Requests",
      requests: pendingRequests,
    });
  } catch (err) {
    console.error("Error loading pending requests:", err);
    res.status(500).render("error", { message: "Failed to load friend requests." });
  }
});

module.exports = router;