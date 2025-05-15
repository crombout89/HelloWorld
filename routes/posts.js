const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const Community = require("../models/community");

// Auth middleware
const { isLoggedIn } = require("../middleware/auth");

// 📝 Show new post form
router.get("/communities/:id/posts/new", isLoggedIn, async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return res.status(404).send("Community not found");

  const isMember = community.members.includes(req.session.userId);
  if (!isMember) return res.status(403).send("Only members can post");

  res.render("new-post", {
    title: `Create a Post in ${community.name}`,
    community,
  });
});

// ➕ Handle new post creation
router.post("/communities/:id/posts", isLoggedIn, async (req, res) => {
  const { title, body, visibility } = req.body;
  const communityId = req.params.id;
  const authorId = req.session.userId;

  try {
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).send("Community not found");

    const isMember = community.members.includes(authorId);
    if (!isMember) return res.status(403).send("Only members can post");

    const post = new Post({
      title,
      body,
      visibility,
      author: authorId,
      community: communityId,
    });

    await post.save();
    res.redirect(`/communities/${communityId}`);
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).send("Failed to create post.");
  }
});

module.exports = router;
