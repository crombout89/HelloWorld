const axios = require('axios');
require('dotenv').config();

class LocationService {
  constructor() {
    this.apiKey = process.env.LOCATIONIQ_API_KEY;
    this.baseUrl = 'https://us1.locationiq.com/v1';
  }

  async reverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse.php`, {
        params: {
          key: this.apiKey,
          lat: latitude,
          lon: longitude,
          format: 'json',
          normalizer: 1
        }
      });

      const locationData = response.data.address;
      
      return {
        fullAddress: response.data.display_name,
        city: locationData.city || locationData.town || locationData.village,
        state: locationData.state,
        country: locationData.country,
        postalCode: locationData.postcode,
        neighborhood: locationData.neighbourhood,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      };
    } catch (error) {
      console.error('Reverse Geocoding Error:', error.response ? error.response.data : error.message);
      throw new Error('Could not retrieve location details');
    }
  }

  async forwardGeocode(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/search.php`, {
        params: {
          key: this.apiKey,
          q: address,
          format: 'json',
          limit: 5
        }
      });

      return response.data.map(location => ({
        displayName: location.display_name,
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon)
      }));
    } catch (error) {
      console.error('Forward Geocoding Error:', error.response ? error.response.data : error.message);
      throw new Error('Could not search for location');
    }
  }

  // Haversine formula for distance calculation
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new LocationService();