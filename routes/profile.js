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
router.post('/profile/interests', (req, res) => {
  const newInterest = req.body.interest?.trim();

  if (!req.session.user.interests) {
    req.session.user.interests = [];
  }

  if (newInterest && !req.session.user.interests.includes(newInterest)) {
    req.session.user.interests.push(newInterest);
  }

  res.redirect('/profile');
});


router.post('/profile/preferences', (req, res) => {
  const selected = req.body.preferences || [];
  req.session.user.preferences = Array.isArray(selected) ? selected : [selected];
  res.redirect('/profile');
});


router.post('/profile/update', upload.single('photo'), (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { name, bio } = req.body;

  req.session.user.name = name;
  req.session.user.bio = bio;

  if (req.file) {
    req.session.user.photo = '/uploads/' + req.file.filename;
  }

  res.redirect('/profile');
});


async function getLocationData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        latitude: 34.0522,
        longitude: -118.2437,
        city: "Los Angeles"
      });
    }, 500);
  });
}

module.exports = router;



