// routes/location.js
const express = require("express");
const router = express.Router();
const LocationService = require("../services/locationService");

router.post("/save", async (req, res) => {
  try {
    const userId = req.session.userId;
    const { city, country, latitude, longitude } = req.body;

    const location = await LocationService.saveUserLocation(userId, {
      city,
      country,
      latitude,
      longitude,
    });

    res.json({ success: true, location });
  } catch (err) {
    console.error("Location Save Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
