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
  const requester = req.session.user?._id;
  const recipient = req.params.userId;

  if (!requester) {
    return res.redirect("/login");
  }

  if (requester === recipient) {
    console.warn("Attempted to friend self");
    return res.redirect(`/profile/${recipient}`);
  }

  try {
    const existing = await Friendship.findOne({
      $or: [
        { requester, recipient },
        { requester: recipient, recipient: requester },
      ],
    });

    if (existing) {
      console.log("Duplicate friend request detected.");
      return res.redirect(`/profile/${recipient}`);
    }

    await Friendship.create({ requester, recipient, status: "pending" });
    console.log(`Friend request sent from ${requester} to ${recipient}`);
    res.redirect(`/profile/${recipient}`);
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.redirect(`/profile/${recipient}`);
  }
});

// 🔄 Accept Friend Request
router.post("/accept/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Friendship.findById(requestId);

    if (!request || request.recipient.toString() !== req.session.user._id) {
      return res.status(403).send("Unauthorized");
    }

    request.status = "accepted";
    await request.save();
    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Accept error:", err);
    res.status(500).send("Error accepting request");
  }
});

// ❌ Decline Friend Request
router.post("/decline/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Friendship.findById(requestId);

    if (!request || request.recipient.toString() !== req.session.user._id) {
      return res.status(403).send("Unauthorized");
    }

    await request.deleteOne();
    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Decline error:", err);
    res.status(500).send("Error declining request");
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

// 📬 View pending friend requests (recipient perspective)
router.get("/requests", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log("🔍 Logged-in userId:", userId); // should be 6824ddbb164954ef265d71bc

    const pendingRequests = await Friendship.find({
      recipient: userId,
      status: "pending",
    }).populate("requester");

    console.log("📥 Found requests:", pendingRequests);

    res.render("friend-requests", {
      title: "Pending Friend Requests",
      requests: pendingRequests,
    });
  } catch (err) {
    console.error("Error loading requests:", err);
    res.status(500).send("Could not load friend requests.");
  }
});

module.exports = router;