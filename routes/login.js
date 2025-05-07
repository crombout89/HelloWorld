// routes/login.js
const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null }); // Pass error, even if null
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { title: 'Login', error: 'Username and password are required' });
  }

  // Placeholder for MongoDB logic (replace with your database lookup and authentication)
  // Example: Find user by username, compare hashed passwords

  // Simulate successful login for now
  console.log("Login attempt:", username, password);

  // Redirect to a protected page after successful login
  res.redirect('/profile'); // Example: Redirect to a profile page
});

module.exports = router;