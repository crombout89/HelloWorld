// routes/location.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const LocationService = require("../services/locationService");

router.post("/update", async (req, res) => {
  try {
    const userId = req.session.userId;
    const { latitude, longitude } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const geo = await LocationService.getReverseGeocoding(latitude, longitude);

    user.profile.location = {
      latitude,
      longitude,
      city: geo.city,
      country: geo.country,
      public: true, // Add toggle later
    };

    await user.save();
    res.json({ success: true, location: user.profile.location });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
});

module.exports = router;
