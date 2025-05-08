// routes/location.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Update user's location (coordinates)
router.post('/update-location', async (req, res) => {
  try {
    // Get the user ID from the session
    const userId = req.session.userId;
    
    // Extract latitude and longitude from request body
    const { latitude, longitude } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update geolocation
    user.geolocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    // Optional: Update profile location if you want to store human-readable location
    // You might want to use a geocoding service here to get city/country
    user.profile.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    // Save the updated user
    await user.save();

    res.json({
      message: 'Location updated successfully',
      location: {
        latitude: user.geolocation.coordinates[1],
        longitude: user.geolocation.coordinates[0]
      }
    });
  } catch (error) {
    console.error('Location Update Error:', error);
    res.status(500).json({ 
      message: 'Failed to update location', 
      error: error.message 
    });
  }
});

module.exports = router;