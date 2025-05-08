// services/locationService.js
const axios = require('axios');

class LocationService {
  // Static method to get coordinates from an address
  static async getCoordinatesFromAddress(address) {
    try {
      const response = await axios.get('https://us1.locationiq.com/v1/search', {
        params: {
          key: process.env.LOCATIONIQ_API_KEY,
          q: address,
          format: 'json'
        }
      });

      if (response.data && response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon)
        };
      }

      throw new Error('No coordinates found for the given address');
    } catch (error) {
      console.error('Geocoding Error:', error);
      throw error;
    }
  }

  // Static method to get address from coordinates
  static async getReverseGeocoding(latitude, longitude) {
    try {
      const response = await axios.get('https://us1.locationiq.com/v1/reverse', {
        params: {
          key: process.env.LOCATIONIQ_API_KEY,
          lat: latitude,
          lon: longitude,
          format: 'json'
        }
      });

      if (response.data && response.data.display_name) {
        return {
          formattedAddress: response.data.display_name,
          city: response.data.address.city || response.data.address.town || '',
          country: response.data.address.country || ''
        };
      }

      throw new Error('No address found for the given coordinates');
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      throw error;
    }
  }

  // Method to calculate distance between two coordinates
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Helper method to convert degrees to radians
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Method to find nearby users
  static async findNearbyUsers(user, maxDistance = 10) {
    try {
      const nearbyUsers = await User.find({
        'geolocation.coordinates': {
          $near: {
            $geometry: user.geolocation,
            $maxDistance: maxDistance * 1000 // Convert km to meters
          }
        },
        _id: { $ne: user._id } // Exclude current user
      }).select('profile geolocation');

      return nearbyUsers;
    } catch (error) {
      console.error('Nearby Users Error:', error);
      throw error;
    }
  }
}

module.exports = LocationService;