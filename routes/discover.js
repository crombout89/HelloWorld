const express = require("express");
const router = express.Router();
const Community = require("../models/community");
const Event = require("../models/event");
const User = require("../models/user");
const haversine = require("haversine-distance");
const { calculateMatchScore } = require("../services/matchService");
const { getFriendsForUser } = require("../services/friendService");
const { calculateItemMatch } = require("../services/discoverMatchService");
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
  const userId = req.session.userId;
  const me = await User.findById(userId).lean();
  if (!me) return res.redirect("/login");

  const friends = await getFriendsForUser(userId);
  const excludedIds = new Set([userId, ...friends.map((f) => f._id.toString())]);

  const candidates = await User.find({
    _id: { $nin: Array.from(excludedIds) },
    "profile.interests": { $exists: true, $ne: [] },
  }).lean();

  const matches = candidates
    .map((u) => ({
      ...u,
      score: calculateMatchScore(me, u),
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  res.render("discover/friends", {
    title: "Discover New Friends",
    matches,
  });
});

// GET /discover/interests
router.get("/interests", isLoggedIn, async (req, res) => {
  const userId = req.session.userId;
  const me = await User.findById(userId).lean();
  if (!me) return res.redirect("/login");

  const [events, communities] = await Promise.all([
    Event.find({
      tags: { $exists: true, $ne: [] },
      visibility: "public",
    }).lean(),
    Community.find({ tags: { $exists: true, $ne: [] } }).lean(),
  ]);

  const matchedEvents = events
    .map((e) => ({ ...e, score: calculateItemMatch(me, e) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  const matchedCommunities = communities
    .map((c) => ({ ...c, score: calculateItemMatch(me, c) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  res.render("discover/interests", {
    title: "Interest Matches",
    matchedEvents,
    matchedCommunities,
  });
});

// GET /discover/nearby
router.get("/nearby", isLoggedIn, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).send("Missing coordinates");

  const userCoords = {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
  };

  const events = await Event.find({ visibility: "public" }).lean();

  const nearbyEvents = events
    .map((event) => {
      if (!event.location?.lat || !event.location?.lon) return null;
      const dist =
        haversine(userCoords, {
          lat: event.location.lat,
          lon: event.location.lon,
        }) / 1000;
      return { ...event, distance: dist };
    })
    .filter((e) => e && e.distance <= 25)
    .sort((a, b) => a.distance - b.distance);

  res.render("discover/nearby", {
    title: "Events Near You",
    nearbyEvents,
  });
});

module.exports = router;
