// services/locationService.js
const axios = require("axios");
const User = require("../models/user");

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

class LocationService {
  // Convert address string to lat/lon using LocationIQ
  static async geocodeAddress(address) {
    const url = `https://us1.locationiq.com/v1/search.php`;
    const params = {
      key: LOCATIONIQ_API_KEY,
      q: address,
      format: "json",
    };

    const res = await axios.get(url, { params });
    const result = res.data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      city:
        result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
    };
  }

  // Save location data to user's profile
  static async saveUserLocation(userId, locationData) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.profile.location = {
      city: locationData.city,
      country: locationData.country,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      public: true,
    };

    await user.save();
    return user.profile.location;
  }
}

module.exports = LocationService;
