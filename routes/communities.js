// routes/communities.js
const fetch = require("node-fetch");

const express = require('express');
const router = express.Router();
const Community = require('../models/community');
const Notification = require("../models/notification");
const { getFriendsForUser } = require("../services/friendService");
const Post = require("../models/post");
const User = require('../models/user');
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Simple middleware to confirm login
function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }
  next();
}

// GET all communities the user is in
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const communities = await Community.find({
      $or: [{ owner: userId }, { members: userId }]
    });

    res.render('communities', {
      title: 'My Communities',
      communities
    });
  } catch (err) {
    console.error('Error loading communities:', err);
    res.status(500).send('Something went wrong.');
  }
});

// Show the form to create a new community
router.get('/new', isAuthenticated, (req, res) => {
  res.render('new-community', {
    title: 'Create New Community'
  });
});

// Handle form submission to create community
router.post(
  "/create",
  isAuthenticated,
  upload.single("coverImage"),
  async (req, res) => {
    const { name, description, category, tags } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const community = new Community({
        name,
        description,
        category,
        tags: tags?.split(",").map((t) => t.trim()),
        coverImage,
        owner: req.session.userId,
        members: [req.session.userId],
      });

      await community.save();
      res.redirect(`/communities/${community._id}`);
    } catch (err) {
      console.error("Error creating community:", err);
      res.status(500).send("Something went wrong");
    }
  }
);


// View a single community
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("owner", "username")
      .populate("members", "username");

    if (!community) {
      return res.status(404).send("Community not found");
    }

    const posts = await Post.find({ community: community._id })
      .sort({ likedBy: -1, createdAt: -1 })
      .populate("author", "username")
      .populate("likes", "_id");

    const isOwner = community.owner._id.toString() === req.session.userId;
    const isMember = community.members.some(
      (m) => m._id.toString() === req.session.userId
    );
    const hasRequested = community.pendingRequests?.some(
      (reqId) => reqId.toString() === req.session.userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).send("You do not have access to this community");
    }

    // ✅ Safely load the user's friends (used for invite dropdown)
    let friends = [];
    try {
      friends = await getFriendsForUser(req.session.userId);
    } catch (err) {
      console.warn("Could not load friends list:", err.message);
    }

    res.render("view-community", {
      title: community.name,
      community,
      isOwner,
      isMember,
      friends,
      hasRequested,
      posts,
      currentUserId: req.session.userId,
    });
  } catch (err) {
    console.error("Error loading community view:", err);
    res.status(500).send("Something went wrong");
  }
});

// Show the edit form for a community (only for owner)
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community || community.owner.toString() !== req.session.userId) {
      return res.status(403).send('Not allowed');
    }

    res.render('edit-community', {
      title: `Edit: ${community.name}`,
      community
    });
  } catch (err) {
    console.error('Error loading edit form:', err);
    res.status(500).send('Something went wrong');
  }
});

// Update the community (only owner)
router.post(
  "/:id/update",
  isAuthenticated,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const community = await Community.findById(req.params.id);
      if (!community) return res.redirect("/communities");

      if (community.owner.toString() !== req.session.userId) {
        return res.status(403).send("Forbidden");
      }

      const updates = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags.split(",").map((tag) => tag.trim()),
      };

      if (req.file) {
        updates.coverImage = "/uploads/" + req.file.filename;
      }

      await Community.findByIdAndUpdate(req.params.id, updates);
      res.redirect(`/communities/${community._id}`);
    } catch (err) {
      console.error("Error updating community:", err);
      res.redirect("/communities");
    }
  }
);

// Delete a community (only owner)
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community || community.owner.toString() !== req.session.userId) {
      return res.status(403).send('Not allowed');
    }

    await Community.findByIdAndDelete(req.params.id);
    res.redirect('/communities');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Delete failed');
  }
});

// Join a community
router.post("/:id/join", isAuthenticated, async (req, res) => {
  try {
    await Community.findByIdAndUpdate(req.params.id, {
      $addToSet: { members: req.session.userId }
    });
    res.redirect(`/communities/${req.params.id}`);
  } catch (err) {
    console.error("Join error:", err);
    res.redirect("/communities");
  }
});

// Leave a community
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    await Community.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.session.userId }
    });
    res.redirect(`/communities/${req.params.id}`);
  } catch (err) {
    console.error("Leave error:", err);
    res.redirect("/communities");
  }
});

// Invite a friend to a community (via notification)
router.post("/:id/invite", isAuthenticated, async (req, res) => {
  const { friendId } = req.body;
  const communityId = req.params.id;

  try {
    const community = await Community.findById(communityId);
    if (!community) throw new Error("Community not found");

    const isMember = community.members.some(
      (m) => m.toString() === req.session.userId
    );
    if (!isMember) return res.status(403).send("Not authorized to invite");

    // Create notification (don't auto-add)
    const Notification = require("../models/notification");

    await Notification.create({
      user: friendId,
      message: `${req.user.username} invited you to join "${community.name}"`,
      link: `/communities/${communityId}`, // optional direct link
      meta: {
        type: "community_invite",
        communityId,
        invitedBy: req.session.userId,
      },
    });

    res.redirect(`/communities/${communityId}`);
  } catch (err) {
    console.error("Invite error:", err);
    res.redirect("/communities");
  }
});

// Accept or decline a community invite
router.post('/:id/respond', isAuthenticated, async (req, res) => {
  const { decision, notificationId } = req.body;

  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send("Community not found");

    if (decision === "accept") {
      const isMember = community.members.includes(req.session.userId);
      if (!isMember) {
        community.members.push(req.session.userId);
        await community.save();
      }
    }

    // Always delete the notification
    const Notification = require("../models/notification");
    await Notification.findByIdAndDelete(notificationId);

    res.redirect(`/communities/${req.params.id}`);
  } catch (err) {
    console.error("Invite response error:", err);
    res.redirect("/notifications");
  }
});

// ✅ Approve or decline a join request (owner only)
router.post("/:id/manage/respond", isAuthenticated, async (req, res) => {
  const { userId, decision } = req.body;

  console.log("🔄 Respond route hit with:", { userId, decision });

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      console.error("❌ Community not found");
      return res.status(404).send("Community not found");
    }

    const isOwner = community.owner.toString() === req.session.userId;
    if (!isOwner) {
      console.warn("⚠️ Unauthorized access");
      return res.status(403).send("Only the owner can manage requests");
    }

    const wasPending = community.pendingRequests.some(
      (id) => id.toString() === userId
    );
    console.log("📋 Was in pendingRequests:", wasPending);

    // Always remove from pendingRequests
    community.pendingRequests = community.pendingRequests.filter(
      (id) => id.toString() !== userId
    );

    if (decision === "accept") {
      const alreadyMember = community.members.some(
        (id) => id.toString() === userId
      );
      if (!alreadyMember) {
        community.members.push(userId);
        console.log("✅ User added to members:", userId);
      } else {
        console.log("⚠️ User already a member");
      }
    } else {
      console.log("❌ Request declined");
    }

    await community.save();
    console.log("💾 Community saved");

    // Optional: notify requester
    await Notification.create({
      user: userId,
      message:
        decision === "accept"
          ? `You were approved to join "${community.name}"`
          : `Your join request for "${community.name}" was declined`,
      link: `/communities/${community._id}/public`,
      meta: {
        type: "join_response",
        status: decision,
        communityId: community._id,
      },
    });

    console.log("📩 Notification sent to user:", userId);
    res.redirect(`/communities/${community._id}/manage`);
  } catch (err) {
    console.error("🔥 Error in join approval:", err);
    res.status(500).send("Something went wrong");
  }
});

// 🧭 Public view of a community (read-only)
router.get('/:id/public', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('owner', 'username')
      .populate('members', 'username');

    if (!community) {
      return res.status(404).render('404');
    }

    const userId = req.session?.userId;
    const isLoggedIn = !!userId;
    const isMember = isLoggedIn && community.members.some(m => m._id.toString() === userId);
    const isOwner = isLoggedIn && community.owner._id.toString() === userId;
    const hasRequested = isLoggedIn && community.pendingRequests?.some(id => id.toString() === userId);

    res.render('public-community', {
      title: `${community.name} (Public View)`,
      community,
      isLoggedIn,
      isMember,
      isOwner,
      hasRequested,
      user: req.session.user || null
    });
  } catch (err) {
    console.error('Public view error:', err);
    res.status(500).render('500');
  }
});

// ✅ REQUEST TO JOIN COMMUNITY
router.post("/:id/request", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send("Community not found");

    const userId = req.session.userId;

    // ⛔ Prevent duplicate requests or rejoining
    const alreadyMember = community.members.includes(userId);
    const alreadyRequested = community.pendingRequests?.includes(userId);
    if (alreadyMember || alreadyRequested) {
      return res.redirect(`/communities/${community._id}`);
    }

    // ✅ Add request to pending list
    community.pendingRequests.push(userId);
    await community.save();

    // 📨 Notify community owner
    const requester = await User.findById(userId);
    const notification = new Notification({
      user: community.owner,
      message: `${requester.username} has requested to join "${community.name}"`,
      link: `/communities/${req.params.id}/manage`,
      meta: {
        type: "join_request",
        communityId: community._id,
        requestedBy: userId
      }
    });

    await notification.save();
    console.log("✅ Sent join request notification to admin:", community.owner);

    // 🔔 Emit real-time notification
    const io = req.app.get("io");
    io.to(community.owner.toString()).emit("notification", notification);

    res.redirect(`/communities/${req.params.id}/public`);
  } catch (err) {
    console.error("Join request error:", err);
    res.redirect("/communities");
  }
});

// ✅ MANAGE COMMUNITY JOIN REQUESTS (Owner Only)
router.get("/:id/manage", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("owner", "username")
      .populate("members", "username")
      .populate("pendingRequests", "username");

    if (!community) return res.status(404).send("Community not found");

    const isOwner = community.owner._id.toString() === req.session.userId;
    if (!isOwner) return res.status(403).send("Not authorized");

    res.render("manage-community", {
      title: `Manage ${community.name}`,
      community,
      pendingRequests: community.pendingRequests,
    });
  } catch (err) {
    console.error("Error loading manage page:", err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;