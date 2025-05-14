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
    const requestId = req.params.requestId;
    const request = await Friendship.findById(requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).send("Friend request not found.");
    }

    // Optional: verify the current user is the recipient
    if (request.recipient.toString() !== req.session.userId) {
      return res.status(403).send("Not authorized.");
    }

    request.status = "accepted";
    await request.save();

    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).send("Server error.");
  }
});

// ❌ Decline Friend Request
router.post("/reject/:requestId", isAuthenticated, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await Friendship.findById(requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).send("Friend request not found.");
    }

    // Optional: verify the current user is the recipient
    if (request.recipient.toString() !== req.session.userId) {
      return res.status(403).send("Not authorized.");
    }

    await request.deleteOne(); // permanently remove the record

    res.redirect("/friends/requests");
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).send("Server error.");
  }
});

// 👥 List current friends
router.get("/", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", "username profile")
      .populate("recipient", "username profile");

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === userId;
      return isRequester ? f.recipient : f.requester;
    });

    res.render("friends", {
      title: "Your Friends",
      friends,
    });
  } catch (err) {
    console.error("Error loading friends:", err);
    res.redirect("/dashboard");
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