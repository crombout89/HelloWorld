// routes/location.js
const express = require("express");
const router = express.Router();
const LocationService = require("../services/locationService");

router.post("/save", async (req, res) => {
  try {
    const userId = req.session.userId;
    const { city, country, latitude, longitude } = req.body;

    console.log("🔍 Session userId:", userId);
    console.log("📦 Incoming location:", {
      city,
      country,
      latitude,
      longitude,
    });

    if (!userId) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    let locationData;

    // 🌍 If lat/lng provided, reverse geocode to get city/country
    if (latitude && longitude) {
      locationData = await LocationService.reverseGeocode(latitude, longitude);
      if (!locationData) throw new Error("Could not reverse geocode location");
    } else if (city && country) {
      // 📝 If manual input, just use that
      locationData = {
        city,
        country,
        latitude: 0,
        longitude: 0,
      };
    } else {
      return res.status(400).json({ error: "Missing location input" });
    }

    const saved = await LocationService.saveUserLocation(userId, locationData);
    res.json({ success: true, location: saved });
  } catch (err) {
    console.error("📍 Location Save Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Reverse geocoding
router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const result = await LocationService.reverseGeocode(lat, lon);
    if (!result) return res.status(404).json({ success: false });

    res.json({
      success: true,
      city: result.city,
      country: result.country,
      road: result.road,
      houseNumber: result.houseNumber,
      fullAddress: result.fullAddress,
    });
  } catch (err) {
    console.error("🔁 Reverse lookup failed:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
