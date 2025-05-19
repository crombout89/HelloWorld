// services/locationService.js
const axios = require("axios");
const User = require("../models/user");

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

class LocationService {
  // 🔁 Reverse geocode from lat/lng to city/country
  static async reverseGeocode(lat, lon) {
    try {
      const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`;
      const res = await axios.get(url);

      const address = res.data.address || {};
      return {
        city: address.city || address.town || address.village || "",
        country: address.country || "",
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
    } catch (err) {
      console.error("❌ Reverse geocoding failed:", err.response?.data || err);
      return null;
    }
  }

  // 💾 Save location to user profile
  static async saveUserLocation(userId, locationData) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.profile.location = {
      address: {
        city: locationData.city,
        country: locationData.country,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        public: true,
      },
    };

    await user.save();
    return user.profile.location.address;
  }
}

module.exports = LocationService;