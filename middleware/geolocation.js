// middleware/geolocation.js
const axios = require('axios');

async function reverseGeocode(latitude, longitude) {
  try {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const response = await axios.get('https://us1.locationiq.com/v1/reverse', {
      params: {
        key: apiKey,
        lat: latitude,
        lon: longitude,
        format: 'json'
      }
    });

    return response.data.address;
  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return null;
  }
}

module.exports = {
  reverseGeocode
};