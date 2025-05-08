const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      message: 'Unauthorized',
      error: 'User not authenticated' 
    });
  }
  next();
};

// Route to update user location
router.post('/update-location', ensureAuthenticated, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Invalid location data',
        error: 'Latitude and longitude are required' 
      });
    }

    // Find user
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'Unable to locate user in database' 
      });
    }

    // Update location
    user.profile.location.coordinates = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    // Update geolocation for geospatial queries
    user.geolocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    // Save the updated user
    await user.save();

    res.json({
      message: 'Location updated successfully',
      location: {
        coordinates: {
          latitude: user.profile.location.coordinates.latitude,
          longitude: user.profile.location.coordinates.longitude
        }
      }
    });
  } catch (error) {
    console.error('Location Update Error:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: 'Failed to update location'
    });
  }
});

// Route to find nearby users
router.get('/nearby', ensureAuthenticated, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;
    
    // Validate input
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const distance = parseFloat(maxDistance);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ 
        message: 'Invalid parameters',
        error: 'Latitude and longitude must be numbers' 
      });
    }

    // Find nearby users
    const nearbyUsers = await User.find({
      _id: { $ne: req.session.userId }, // Exclude current user
      geolocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: distance * 1000 // Convert km to meters
        }
      }
    }).limit(10); // Limit to 10 users

    // Calculate distances manually
    const usersWithDistance = nearbyUsers.map(nearbyUser => {
      const userLon = nearbyUser.geolocation.coordinates[0];
      const userLat = nearbyUser.geolocation.coordinates[1];
      const distance = calculateDistance(lat, lon, userLat, userLon);

      return {
        username: nearbyUser.username,
        distance: distance
      };
    });

    res.json({
      message: 'Nearby users retrieved successfully',
      users: usersWithDistance
    });
  } catch (error) {
    console.error('Nearby Users Error:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: 'Failed to retrieve nearby users'
    });
  }
});

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;