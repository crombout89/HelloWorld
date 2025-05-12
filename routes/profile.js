const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });


router.get('/profile', async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.redirect('/login');

  if (!sessionUser.preferences) sessionUser.preferences = [];
  if (!sessionUser.interests) sessionUser.interests = [];

  const userData = {
    username: sessionUser.username,
    email: sessionUser.email || 'Not provided',
    role: sessionUser.role || 'user',
    joinDate: sessionUser.createdAt
      ? new Date(sessionUser.createdAt).toLocaleDateString()
      : 'Unknown',
    interests: sessionUser.interests,
    preferences: sessionUser.preferences,
    name: sessionUser.name || '',
    bio: sessionUser.bio || '',
    photo: sessionUser.photo || ''
  };

  let locationData;
  try {
    locationData = await getLocationData();
  } catch (error) {
    locationData = { error: "Could not retrieve location" };
  }

  res.render('profile', {
    title: 'Your Profile',
    user: userData,
    location: locationData
  });
});


