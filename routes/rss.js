// routes/rss.js

const express = require("express");
const router = express.Router();
const { create } = require("xmlbuilder2");
const Community = require("../models/community");
const Post = require("../models/post"); // Optional: for community posts
const { isLoggedIn } = require("../middleware/auth");

// 🔄 Generate RSS feed for community updates
router.get("/communities/:id", isLoggedIn, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("members", "username")
      .lean();

    if (!community) return res.status(404).send("Community not found");

    // 🔒 Ensure user is a member to view private feed
    const isMember = community.members.some(
      (m) => m._id.toString() === req.session.userId
    );
    if (!isMember) return res.status(403).send("Unauthorized");

    // 🧱 Example content (can swap with real updates or posts)
    const items = [
      {
        title: `Welcome to ${community.name}`,
        link: `http://localhost:3000/communities/${community._id}`,
        description: community.description || "Check out what's happening!",
        pubDate: new Date(community.createdAt).toUTCString(),
      },
    ];

    // 🛠 Build XML
    const xml = create({
      version: "1.0",
      encoding: "UTF-8",
      rss: {
        "@version": "2.0",
        channel: {
          title: `${community.name} Community Feed`,
          link: `http://localhost:3000/communities/${community._id}`,
          description: `Latest updates from ${community.name}`,
          language: "en",
          item: items.map((entry) => ({
            title: entry.title,
            link: entry.link,
            description: entry.description,
            pubDate: entry.pubDate,
          })),
        },
      },
    }).end({ prettyPrint: true });

    res.type("application/rss+xml").send(xml);
  } catch (err) {
    console.error("RSS feed error:", err);
    res.status(500).send("Error generating feed");
  }
});

module.exports = router;
