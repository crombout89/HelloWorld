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

// DELETE a post (only post author or community owner)
router.post("/posts/:postId/delete", isLoggedIn, async (req, res) => {
  const { postId } = req.params;
  const { communityId } = req.body;
  const userId = req.session.userId;

  try {
    const post = await Post.findById(postId).populate("author", "_id");
    const community = await Community.findById(communityId).populate(
      "owner",
      "_id"
    );

    if (!post || !community) {
      return res.status(404).send("Post or community not found");
    }

    const isOwner = community.owner._id.toString() === userId;
    const isAuthor = post.author._id.toString() === userId;

    if (!isOwner && !isAuthor) {
      return res
        .status(403)
        .send("You do not have permission to delete this post.");
    }

    await Post.findByIdAndDelete(postId);
    res.redirect(`/communities/${communityId}`);
  } catch (err) {
    console.error("Post delete error:", err);
    res.status(500).send("Something went wrong while deleting the post.");
  }
});

// ✅ Final: POST /posts/:id/edit — Update an existing post
router.post("/:postId/edit", isLoggedIn, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, body } = req.body;

    const post = await Post.findById(postId)
      .populate("author")
      .populate("community");

    if (!post) return res.status(404).send("Post not found");

    const userId = req.session.userId;
    const isOwner = post.author._id.toString() === userId;
    const isAdmin = post.community.owner.toString() === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).send("Unauthorized to edit this post");
    }

    post.title = title;
    post.body = body;
    await post.save();

    res.redirect(`/communities/${post.community._id}`);
  } catch (err) {
    console.error("Post update error:", err);
    res.status(500).send("Something went wrong updating the post");
  }
});

module.exports = router;
