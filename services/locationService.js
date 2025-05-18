// services/locationService.js
const User = require("../models/user");

class LocationService {
  static async saveUserLocation(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.profile.location = {
      city: data.city,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      public: true,
    };

    await user.save();
    return user.profile.location;
  }
}

module.exports = LocationService;
