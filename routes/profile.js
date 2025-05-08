/** const express = require('express');
const router = express.Router();

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
    preferences: sessionUser.preferences
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
  const selected = req.body.preferences || []; // array or string
  req.session.user.preferences = Array.isArray(selected) ? selected : [selected];
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

module.exports = router;*/

// routes/profile.js
const express = require('express');
const router = express.Router();

router.get('/profile', async (req, res) => { // Make the callback async
  // Placeholder for user authentication/authorization (you'll add this later)
  // Example: Check if the user is logged in (e.g., using sessions or JWT)

  // Placeholder for getting user data from MongoDB (you'll add this later)
  const userData = {
    username: 'exampleUser', // Replace with actual user data from MongoDB
    // ... other user data ...
  };

  let locationData = null;
  try {
    locationData = await getLocationData(); // Now await works correctly
  } catch (error) {
    console.error("Error getting location:", error);
    locationData = { error: "Could not retrieve location" };
  }

  res.render('profile', { title: 'Profile', user: userData, location: locationData });
});

// ... (getLocationData function remains the same) ...

module.exports = router;
