// services/locationService.js
const axios = require("axios");

class LocationService {
  static async getReverseGeocoding(lat, lon) {
    const { data } = await axios.get("https://us1.locationiq.com/v1/reverse", {
      params: {
        key: process.env.LOCATIONIQ_API_KEY,
        lat,
        lon,
        format: "json",
      },
    });

    return {
      city:
        data.address.city || data.address.town || data.address.village || "",
      country: data.address.country || "",
      full: data.display_name || "",
    };
  }
}

module.exports = LocationService;