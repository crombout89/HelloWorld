const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET Login Page
router.get('/', (req, res) => {
  res.render('login', { 
    title: 'Login', 
    error: null 
  });
});

// POST Login Route
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.render('login', { 
        title: 'Login', 
        error: 'User not found' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid credentials' 
      });
    }
    
    // Successful login (you might want to add session/token management)
    res.redirect('/dashboard'); // or wherever you want to redirect after login
  } catch (error) {
    console.error('Login Error:', error);
    res.render('login', { 
      title: 'Login', 
      error: 'An unexpected error occurred' 
    });
  }
});

module.exports = router;