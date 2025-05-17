const express = require("express");
const router = express.Router();
const Community = require("../models/community");
const Event = require("../models/event");
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

module.exports = router;
