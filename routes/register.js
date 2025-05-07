// routes/register.js
const express = require('express');
const router = express.Router();

router.get('/register', (req, res) => {
    // Always pass 'error' (even if null) to avoid the undefined error:
    res.render('register', { title: 'Register', error: null }); 
  });

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Basic validation (you'll enhance this later with MongoDB checks)
  if (!username || !password) {
    return res.render('register', { title: 'Register', error: 'Username and password are required' });
  }

  // Placeholder for MongoDB interaction (replace with actual database logic)
  // Example: Check if username already exists, hash the password, save to database

  console.log('Registered user:', username); // Temporary for demonstration

  // Redirect to a success page or login page after successful registration
  res.redirect('/login'); 
});

module.exports = router;