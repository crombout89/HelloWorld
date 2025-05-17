const fetch = require("node-fetch");
const express = require("express");
const router = express.Router();
const Community = require("../models/community");
const Notification = require("../models/notification");
const { sendNotification } = require("../services/notificationService");
const { getFriendsForUser } = require("../services/friendService");
const Post = require("../models/post");
const User = require("../models/user");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

function isAuthenticated(req, res, next) {
  if (!req.session?.userId) return res.redirect("/login");
  next();
}

// GET all communities
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const communities = await Community.find({
      $or: [{ owner: userId }, { members: userId }],
    });
    res.render("communities/index", { title: "My Communities", communities });
  } catch (err) {
    console.error("Error loading communities:", err);
    res.status(500).send("Something went wrong.");
  }
});

// New community form
router.get("/new", isAuthenticated, (req, res) => {
  res.render("communities/new", { title: "Create New Community" });
});

// Create community
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

// 🔁 Legacy redirect from /:id/public to canonical /:id
router.get("/:id/public", (req, res) => {
  return res.redirect(`/communities/${req.params.id}`);
});

// View community
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("owner", "username")
      .populate("members", "username");

    if (!community) return res.status(404).send("Community not found");

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

    let friends = [];
    try {
      friends = await getFriendsForUser(req.session.userId);
    } catch (err) {
      console.warn("Could not load friends list:", err.message);
    }

    res.render("communities/view", {
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

// Edit community form
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community || community.owner.toString() !== req.session.userId)
      return res.status(403).send("Not allowed");

    res.render("communities/edit", {
      title: `Edit: ${community.name}`,
      community,
    });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Something went wrong");
  }
});

// Update community
router.post(
  "/:id/update",
  isAuthenticated,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const community = await Community.findById(req.params.id);
      if (!community) return res.redirect("/communities");

      if (community.owner.toString() !== req.session.userId)
        return res.status(403).send("Forbidden");

      const updates = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags.split(",").map((tag) => tag.trim()),
      };
      if (req.file) updates.coverImage = "/uploads/" + req.file.filename;

      await Community.findByIdAndUpdate(req.params.id, updates);
      res.redirect(`/communities/${community._id}`);
    } catch (err) {
      console.error("Error updating community:", err);
      res.redirect("/communities");
    }
  }
);

// Manage community
router.get("/:id/manage", isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("owner", "username")
      .populate("members", "username")
      .populate("pendingRequests", "username");

    if (!community) return res.status(404).send("Community not found");
    const isOwner = community.owner._id.toString() === req.session.userId;
    if (!isOwner) return res.status(403).send("Not authorized");

    res.render("communities/manage", {
      title: `Manage ${community.name}`,
      community,
      pendingRequests: community.pendingRequests,
      layout: false,
    });
  } catch (err) {
    console.error("Error loading manage page:", err);
    res.status(500).send("Something went wrong");
  }
});

// Manage community [modal logic]
router.get("/:id/manage/modal", isAuthenticated, async (req, res) => {
  const community = await Community.findById(req.params.id)
    .populate("owner", "username")
    .populate("members", "username")
    .populate("pendingRequests", "username");

  if (!community) return res.status(404).send("Community not found");
  if (community.owner._id.toString() !== req.session.userId)
    return res.status(403).send("Unauthorized");

  res.render("communities/manage", {
    title: `Manage ${community.name}`,
    community,
    pendingRequests: community.pendingRequests,
    layout: false, // ✅ modal-friendly
  });
});

module.exports = router;
