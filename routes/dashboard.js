const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Friendship = require("../models/friendship");

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
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    // Fetch accepted friendships
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", "username profile")
      .populate("recipient", "username profile");

    // Extract friend objects
    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === userId;
      return isRequester ? f.recipient : f.requester;
    });

    const locationDetails = {
      address: user.profile.location || "Not specified",
      hasLocation: !!user.profile.location,
    };

    res.render("dashboard", {
      user,
      friends,
      locationDetails,
      title: "Dashboard",
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.redirect("/login");
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
router.post('/profile/update', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { 
      firstName, 
      lastName, 
      location, 
      interests, 
      bio 
    } = req.body;

    const user = await User.findById(userId);

    // Update profile fields
    user.profile.firstName = firstName;
    user.profile.lastName = lastName;
    user.profile.location = location;
    user.profile.bio = bio;
    
    // Process interests
    if (interests) {
      user.profile.interests = interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);
    }

    await user.save();

    req.flash('success', 'Profile updated successfully');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Profile Update Error:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/dashboard');
  }
});

module.exports = router;