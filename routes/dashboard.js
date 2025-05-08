const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  // For now, we'll just check if a user is logged in
  // In a real app, you'd use session or JWT authentication
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
};

// Dashboard Route
router.get('/', async (req, res) => {
    // This assumes you're using express-session
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    try {
      // Fetch user details using the ID stored in the session
      const user = await User.findById(req.session.userId).select('-password');
      
      if (!user) {
        return res.redirect('/login');
      }
  
      res.render('dashboard', { 
        user: user,
        title: 'Dashboard' 
      });
    } catch (error) {
      console.error('Dashboard Error:', error);
      res.redirect('/login');
    }
  });

// Profile Edit Route (example)
router.get('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    res.render('edit-profile', { 
      user: user,
      title: 'Edit Profile' 
    });
  } catch (error) {
    console.error('Edit Profile Error:', error);
    res.redirect('/dashboard');
  }
});

// Profile Update Route
router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, bio, interests, address } = req.body;

    const user = await User.findById(userId);

    // Update profile fields
    user.profile.firstName = firstName;
    user.profile.lastName = lastName;
    user.profile.bio = bio;
    user.profile.interests = interests.split(',').map(interest => interest.trim());

    // Geocode address if provided
    if (address) {
      try {
        await user.geocodeAddress(address);
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError.message);
        // Continue with profile update even if geocoding fails
      }
    }

    await user.save();

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.redirect('/dashboard');
  }
});

module.exports = router;