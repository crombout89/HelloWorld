// routes/community.js
const express = require('express');
const router = express.Router();
const Community = require('../models/community');
const User = require('../models/user');

// Middleware to ensure user is logged in
function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// GET all communities user is part of or owns
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const communities = await Community.find({
      $or: [{ owner: userId }, { members: userId }]
    });
    res.render('communities', { communities, title: 'My Communities' });
  } catch (err) {
    console.error('Error loading communities:', err);
    res.redirect('/dashboard');
  }
});

// GET form to create a community
router.get('/new', isAuthenticated, (req, res) => {
  res.render('new-community', { title: 'Create Community' });
});

// POST to create community
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.session.userId;

    const community = new Community({
      name,
      description,
      owner: userId,
      members: [userId] // Owner is auto-joined
    });

    await community.save();
    res.redirect('/communities');
  } catch (err) {
    console.error('Error creating community:', err);
    res.redirect('/communities/new');
  }
});

// GET form to edit a community
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    // Only allow owner to edit
    if (!community || community.owner.toString() !== req.session.userId) {
      return res.redirect('/communities');
    }

    res.render('edit-community', { community, title: 'Edit Community' });
  } catch (err) {
    console.error('Edit community error:', err);
    res.redirect('/communities');
  }
});

// POST updated community info
router.post('/:id/update', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community || community.owner.toString() !== req.session.userId) {
      return res.redirect('/communities');
    }

    const { name, description } = req.body;
    community.name = name;
    community.description = description;
    await community.save();

    res.redirect('/communities');
  } catch (err) {
    console.error('Update community error:', err);
    res.redirect('/communities');
  }
});

// POST to delete a community
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community || community.owner.toString() !== req.session.userId) {
      return res.redirect('/communities');
    }

    await Community.findByIdAndDelete(req.params.id);
    res.redirect('/communities');
  } catch (err) {
    console.error('Delete community error:', err);
    res.redirect('/communities');
  }
});