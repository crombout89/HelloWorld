// routes/location.js
const express = require("express");
const router = express.Router();
const LocationService = require("../services/locationService");

// Save a user’s location from address input
router.post("/save", async (req, res) => {
  try {
    console.log("🔍 Session userId:", req.session.userId);
    console.log("🔍 Request body:", req.body);

    const { city, country, latitude, longitude } = req.body;
    const userId = req.session.userId;

    if (!userId || !city || !country || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing user or address" });
    }

    const savedLocation = await LocationService.saveUserLocation(userId, {
      city,
      country,
      latitude,
      longitude,
    });

    res.json({ success: true, location: savedLocation });
  } catch (err) {
    console.error("📍 Location Save Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
