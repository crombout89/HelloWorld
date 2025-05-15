const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const Community = require("../models/community");
const Post = require("../models/post");

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

// ➕ Handle new community post creation
router.post("/communities/:id/posts", isLoggedIn, async (req, res) => {
  const { title, body } = req.body;
  const communityId = req.params.id;
  const authorId = req.session.userId;

  try {
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).send("Community not found");

    const isMember = community.members.includes(authorId);
    if (!isMember) return res.status(403).send("Only members can post");

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).send("Post must have a title and body");
    }

    const newPost = new Post({
      title,
      body,
      community: community._id,
      author: authorId,
    });

    await newPost.save();
    res.redirect(`/communities/${req.params.id}`);
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).send("Failed to create post.");
  }
});

// 📝 Create a new post in a community
router.post("/communities/:id/posts", isLoggedIn, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.redirect(`/communities/${req.params.id}`);
    }

    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).send("Community not found");

    const isMember = community.members.includes(req.session.userId);
    if (!isMember) return res.status(403).send("Only members can post");

    const newPost = new Post({
      content,
      community: community._id,
      author: req.session.userId,
    });

    await newPost.save();
    res.redirect(`/communities/${req.params.id}`);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).send("Something went wrong");
  }
});

// DELETE a post by ID
router.post(
  "/communities/:communityId/posts/:postId/delete",
  isLoggedIn,
  async (req, res) => {
    const { communityId, postId } = req.params;

    try {
      const post = await Post.findById(postId).populate("author");
      const community = await Community.findById(communityId);

      if (!post || !community) {
        return res.status(404).send("Post or Community not found");
      }

      const isOwner = community.owner.toString() === req.session.userId;
      const isAuthor = post.author._id.toString() === req.session.userId;

      if (!isOwner && !isAuthor) {
        return res
          .status(403)
          .send("You do not have permission to delete this post");
      }

      await post.deleteOne();

      res.redirect(`/communities/${communityId}`);
    } catch (err) {
      console.error("Post delete error:", err);
      res.status(500).send("Error deleting post");
    }
  }
);

module.exports = router;
