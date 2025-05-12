// routes/register.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Register', 
        error: null,
        success: null
    }); 
});

router.post('/register', async (req, res) => {
    const { username, email, password, firstName, lastName, address } = req.body;

    try {
        // Validation checks
        if (!username || !email || !password) {
            return res.render('register', { 
                title: 'Register', 
                error: 'Username, email, and password are required',
                success: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.render('register', { 
                title: 'Register', 
                error: 'User with this email or username already exists',
                success: null
            });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            password,
            profile: {
                firstName,
                lastName
            }
        });

        // Optional: Geocode address if provided
        if (address) {
            try {
                await newUser.geocodeAddress(address);
            } catch (geocodeError) {
                console.warn('Geocoding failed:', geocodeError.message);
                // Continue with user creation even if geocoding fails
            }
        }

        // Validate geolocation is complete before save
        if (!newUser.geolocation?.coordinates || newUser.geolocation.coordinates.length !== 2) {
        newUser.geolocation = undefined; // prevent geo index error
        }

        await newUser.save();

        // Render success page or redirect
        res.render('register', {
            title: 'Register',
            error: null,
            success: 'Registration successful! You can now log in.'
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.render('register', { 
            title: 'Register', 
            error: 'An error occurred during registration',
            success: null
        });
    }
});

module.exports = router;