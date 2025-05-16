import express from "express";
import Report from "../models/Report.js";
import { isLoggedIn } from "../middleware/auth.js"; // or whatever you're using

const router = express.Router();

// POST /reports
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body;
    const report = new Report({
      contentType,
      contentId,
      reason,
      reportedBy: req.user._id,
    });
    await report.save();
    res.status(201).json({ message: "Report submitted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// Pass in reports
router.get("/reports", isLoggedIn, async (req, res) => {
  try {
    const reports = await Report.find({ resolved: false })
      .populate("reportedBy", "username")
      .sort({ createdAt: -1 });

    res.render("manage-community", { reports }); // reuse dashboard
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading reports");
  }
});

export default router;
