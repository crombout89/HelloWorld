const express = require("express");
const router = express.Router();
const Friendship = require("../models/friendship");
const Notification = require("../models/notification");
const { sendNotification } = require("../services/notificationService");
const User = require("../models/user");

function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Send Friend Request
router.post("/request/:id", isAuthenticated, async (req, res) => {
  try {
    const recipientId = req.params.id;
    const requesterId = req.session.userId;

    if (recipientId === requesterId) return res.redirect("/home");

    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) return res.redirect("/home");

    const sender = await User.findById(requesterId);
    if (!sender) return res.status(404).send("Sender not found");

    const request = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await sendNotification(
      {
        userId: recipientId,
        message: `${sender.username} sent you a friend request`,
        meta: {
          type: "friend_request",
          from: sender._id,
          requestId: request._id,
        },
      },
      req.app.get("io")
    );

    res.redirect(`/u/${sender.username}`);
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).send("Something went wrong");
  }
});

// Accept or Decline a Friend Request (used by notification buttons)
router.post("/respond/:requestId", isAuthenticated, async (req, res) => {
  const { requestId } = req.params;
  const { decision, notificationId } = req.body;

  try {
    const request = await Friendship.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).send("Friend request not found.");
    }

    if (request.recipient.toString() !== req.session.userId) {
      return res.status(403).send("Not authorized.");
    }

    if (decision === "accept") {
      request.status = "accepted";
      await request.save();

      await sendNotification(
        {
          userId: request.requester,
          message: `${req.user.username} accepted your friend request`,
          link: `/u/${req.user.username}`,
          meta: { type: "friend_accept", by: req.user._id },
        },
        req.app.get("io")
      );
    } else if (decision === "decline") {
      await request.deleteOne();
    }

    // Clean up notification
    if (notificationId) {
      await Notification.findByIdAndDelete(notificationId);
    }

    res.redirect("/notifications");
  } catch (err) {
    console.error("⚠️ Error responding to friend request:", err);
    res.status(500).send("Something went wrong");
  }
});

// 👥 List current friends
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", "username profile")
      .populate("recipient", "username profile");

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === userId;
      const friend = isRequester ? f.recipient : f.requester;

      const profilePicture = friend.profile?.profilePicture?.startsWith(
        "/uploads"
      )
        ? friend.profile.profilePicture
        : "/default-profile.png";

      return {
        _id: friend._id,
        username: friend.username,
        profilePicture,
      };
    });

    res.render("user/friends", { title: "Your Friends", friends });
  } catch (err) {
    console.error("Friends page error:", err);
    res.redirect("/dashboard");
  }
});

// ❌ Remove a friend
router.post("/remove/:userId", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const friendId = req.params.userId;

  try {
    const result = await Friendship.findOneAndDelete({
      status: "accepted",
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ],
    });

    if (!result) {
      console.warn("No matching friendship found.");
      return res.status(404).redirect("/friends");
    }

    res.redirect("/friends");
  } catch (err) {
    console.error("Friend removal error:", err);
    res.redirect("/friends");
  }
});

module.exports = router;
