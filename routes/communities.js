// routes/communities.js
const express = require('express');
const router = express.Router();
const Community = require('../models/community');
const { getFriendsForUser } = require("../services/friendService");
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

    const isOwner = community.owner._id.toString() === req.session.userId;
    const isMember = community.members.some(
      (m) => m._id.toString() === req.session.userId
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
      friends, // ✅ now passed to EJS
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

// Invite a friend to a community
router.post("/:id/invite", isAuthenticated, async (req, res) => {
  const { friendId } = req.body;
  const communityId = req.params.id;

  try {
    const community = await Community.findById(communityId);
    if (!community) throw new Error("Community not found");

    // Make sure only members can invite
    const isMember = community.members.some(
      (m) => m.toString() === req.session.userId
    );
    if (!isMember) return res.status(403).send("Not authorized to invite");

    // Avoid duplicates
    if (!community.members.includes(friendId)) {
      community.members.push(friendId);
      await community.save();
    }

    res.redirect(`/communities/${communityId}`);
  } catch (err) {
    console.error("Invite error:", err);
    res.redirect("/communities");
  }
});

module.exports = router;