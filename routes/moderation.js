// routes/moderation.js

const express = require("express");
const Report = require("../models/Report");
const Post = require("../models/Post"); // if you're moderating posts
const { isLoggedIn, isOwner } = require("../middleware/auth");

const router = express.Router();

// GET /moderation/reports
router.get("/reports", isLoggedIn, isOwner, async (req, res) => {
  try {
    const reports = await Report.find({ resolved: false })
      .populate("reportedBy", "username")
      .sort({ createdAt: -1 });

    res.render("moderation-reports", { reports });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading reports");
  }
});

// POST /moderation/reports/:id/resolve
router.post("/reports/:id/resolve", isLoggedIn, async (req, res) => {
  try {
    const reportId = req.params.id;
    await Report.findByIdAndUpdate(reportId, { resolved: true });

    res.redirect("/moderation/reports");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to resolve report");
  }
});

module.exports = router;
