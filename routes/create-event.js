const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/user');

// Middleware to check authentication
const isAuthenticated = async (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
};

// Create Event Route
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    res.render('create-event', { 
      user: user,
      title: 'Create Event',
      categories: [
        'Music', 
        'Sports', 
        'Arts & Theater', 
        'Food & Drink', 
        'Technology', 
        'Professional', 
        'Other'
      ]
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    req.flash('error', 'Unable to load create event page');
    res.redirect('/dashboard');
  }
});

// Add more robust error handling
router.post('/', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { 
        title, 
        description, 
        category, 
        date, 
        time, 
        location, 
        capacity 
      } = req.body;
  
      // Add more validation
      if (!title || !description || !category || !date || !time || !location) {
        req.flash('error', 'All fields are required');
        return res.redirect('/create-event');
      }
  
      const newEvent = new Event({
        title,
        description,
        category,
        date: new Date(date),
        time,
        location,
        capacity: Number(capacity) || 0, // Default to 0 if not provided
        organizer: userId
      });
  
      await newEvent.save();
  
      req.flash('success', 'Event created successfully');
      res.status(201).json({ 
        message: 'Event created successfully', 
        eventId: newEvent._id 
      });
    } catch (error) {
      console.error('Event Creation Error:', error);
      res.status(500).json({ 
        message: 'Failed to create event',
        error: error.message 
      });
    }
  });

module.exports = router;