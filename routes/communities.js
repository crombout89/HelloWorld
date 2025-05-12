// routes/communities.js
const express = require('express');
const router = express.Router();
const Community = require('../models/community');

// Simple middleware to confirm login
function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }
  next();
}

// GET all communities the user is in
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const communities = await Community.find({
      $or: [{ owner: userId }, { members: userId }]
    });

    res.render('communities', {
      title: 'My Communities',
      communities
    });
  } catch (err) {
    console.error('Error loading communities:', err);
    res.status(500).send('Something went wrong.');
  }
});

// Show the form to create a new community
router.get('/new', isAuthenticated, (req, res) => {
  res.render('new-community', {
    title: 'Create New Community'
  });
});

// Handle form submission to create community
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.session.userId;

    const community = new Community({
      name,
      description,
      owner: userId,
      members: [userId]
    });

    await community.save();
    res.redirect('/communities');
  } catch (err) {
    console.error('Error creating community:', err);
    res.status(500).send('Failed to create community');
  }
});

module.exports = router;