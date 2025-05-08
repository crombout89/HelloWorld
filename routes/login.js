// routes/location.js
const express = require('express');
const router = express.Router();
const User = require('../middleware/auth'); // Adjust path as needed
const axios = require('axios');

// Geocode an address
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    // Use LocationIQ directly as a fallback/example
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const response = await axios.get('https://us1.locationiq.com/v1/search', {
      params: {
        key: apiKey,
        q: address,
        format: 'json',
        limit: 1
      }
    });

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      
      res.json({
        address: address,
        coordinates: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        },
        city: location.address.city || location.address.town || '',
        country: location.address.country || ''
      });
    } else {
      res.status(404).json({ message: 'Location not found' });
    }
  } catch (error) {
    console.error('Geocoding Error:', error);
    res.status(500).json({ 
      message: 'Error geocoding address', 
      error: error.message 
    });
  }
});

// Find nearby users
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;
    
    const nearbyUsers = await User.find({
      geolocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    }).select('username profile.location'); // Limit returned fields

    res.json(nearbyUsers);
  } catch (error) {
    console.error('Nearby Users Error:', error);
    res.status(500).json({ 
      message: 'Error finding nearby users', 
      error: error.message 
    });
  }
});

// Update user's location
router.post('/update', async (req, res) => {
  try {
    const { userId, address } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Geocode and update location
    await user.geocodeAddress(address);
    await user.save();

    res.json({
      message: 'Location updated successfully',
      location: user.profile.location
    });
  } catch (error) {
    console.error('Location Update Error:', error);
    res.status(500).json({ 
      message: 'Error updating location', 
      error: error.message 
    });
  }
});

module.exports = router;