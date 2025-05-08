const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Ensure correct path to User model

// GET Register Page
router.get('/', (req, res) => {
  res.render('register', { 
    title: 'Register', 
    error: null 
  });
});

// POST Register Route
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.render('register', { 
        title: 'Register', 
        error: 'Username or email already exists' 
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      profile: {
        firstName: '',
        lastName: '',
        bio: '',
        interests: []
      }
    });
    
    // Save user
    await newUser.save();
    
    // Redirect to login or dashboard
    res.redirect('/login');
  } catch (error) {
    console.error('Registration Error:', error);
    res.render('register', { 
      title: 'Register', 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

module.exports = router;