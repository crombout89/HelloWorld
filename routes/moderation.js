// routes/moderation.js

const express = require("express");
const router = express.Router();
const Report = require("../models/report");
const Post = require("../models/post");
const { isLoggedIn, isOwner } = require("../middleware/auth");

// 📝 CREATE a new report
// POST /moderation/report
router.post("/report", isLoggedIn, async (req, res) => {
  console.log("🐛 HIT POST /moderation/report");
  try {
    const { contentType, contentId, reason } = req.body;

    const report = new Report({
      contentType,
      contentId,
      reason,
      reportedBy: req.session.userId,
    });

    await report.save();
    console.log("✅ Report submitted:", report);

    const referer = req.get("referer") || "/";
    res.redirect(referer);
  } catch (err) {
    console.error("❌ Error creating report:", err);
    res.status(500).send("Could not submit report");
  }
});

// 📋 VIEW unresolved reports
// GET /moderation/reports
router.get("/reports", isLoggedIn, isOwner, async (req, res) => {
  try {
    const reports = await Report.find({ resolved: false })
      .populate("reportedBy", "username")
      .sort({ createdAt: -1 });

    res.render("moderation-reports", { reports });
  } catch (err) {
    console.error("❌ Error loading reports:", err);
    res.status(500).send("Error loading reports");
  }
});

// ✅ MARK a report as resolved
// POST /moderation/reports/:id/resolve
router.post("/reports/:id/resolve", isLoggedIn, async (req, res) => {
  try {
    const reportId = req.params.id;
    await Report.findByIdAndUpdate(reportId, { resolved: true });

    res.redirect("/moderation/reports");
  } catch (err) {
    console.error("❌ Failed to resolve report:", err);
    res.status(500).send("Failed to resolve report");
  }
});

module.exports = router;
