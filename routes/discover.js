const express = require("express");
const router = express.Router();
const Community = require("../models/community");
const Event = require("../models/event");
const User = require("../models/user");
const { calculateMatchScore } = require("../services/matchService");
const { getFriendsForUser } = require("../services/friendService");
const { isLoggedIn } = require("../middleware/auth");

router.get("/", (req, res) => {
  res.render("discover", {
    title: "Discover",
    discoveryOptions: [
      {
        icon: "assets/svg/group-events.svg",
        title: "Communities",
        description: "Browse user communities",
      },
      {
        icon: "assets/svg/search-by-location.svg",
        title: "Search by Location",
        description: "Enter a city or address",
      },
      {
        icon: "assets/svg/near-me.svg",
        title: "Near Me",
        description: "Use current location",
      },
      {
        icon: "assets/svg/near-me.svg",
        title: "Find Friends",
        description: "Connect with new people",
      },
      {
        icon: "assets/svg/near-me.svg",
        title: "Search by Interest",
        description: "Virtual social groups",
      },
    ],
  });
});

// GET /discover/communities
router.get("/communities", isLoggedIn, async (req, res) => {
  try {
    const communities = await Community.find().populate("owner", "username");
    res.render("discover/communities", {
      title: "Community Directory",
      communities,
    });
  } catch (err) {
    console.error("Error loading community directory:", err);
    res.status(500).send("Something went wrong");
  }
});

// GET /discover/events
router.get("/events", isLoggedIn, async (req, res) => {
  try {
    const events = await Event.find({ visibility: "public" })
      .sort({ startTime: 1 })
      .populate("host")
      .lean();

    res.render("discover/events", {
      title: "Discover Events",
      events,
    });
  } catch (err) {
    console.error("Error loading events:", err);
    res.status(500).send("Something went wrong");
  }
});

// GET /discover/friends
router.get("/friends", isLoggedIn, async (req, res) => {
  console.log("👋 /discover/friends route hit");

  try {
    const userId = req.session.userId;
    const me = await User.findById(userId).populate("profile.tags").lean();
    if (!me) return res.redirect("/login");

    console.log("🧍 Current user:", me.username);
    console.log("🧠 Tags:", me.profile.tags.map(t => t.name || t));

    // 🧱 Step A: Exclude self and friends
    const friends = await getFriendsForUser(userId);
    const excludedIds = new Set([userId, ...friends.map(f => f._id.toString())]);

    const candidates = await User.find({
      _id: { $nin: Array.from(excludedIds) }
    }).populate("profile.tags").lean();

    console.log("🎯 Candidate pool size (post exclusion):", candidates.length);

    const matches = candidates
      .filter(
        (u) => Array.isArray(u.profile?.tags) && u.profile.tags.length > 0
      )
      .map((u) => ({ ...u, score: calculateMatchScore(me, u) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);

    res.render("discover/friends", {
      title: "Discover New Friends",
      matches,
    });

  } catch (err) {
    console.error("🔥 Error in /discover/friends:", err);
    res.status(500).send("Something broke loading matches");
  }
});

module.exports = router;
