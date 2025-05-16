const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// GET route to render the invite form
router.get('/invite', (req, res) => {
  res.render('invite', { query: req.query , title: 'Invite a Friend' });
});

// POST route to handle invite email sending
router.post('/invite', async (req, res) => {
  const { email } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'You are Invited!',
      text: `Hi! You've been invited to join HelloWorld.app. Click here to sign up: https://your-app-url/signup`,
    };

    await transporter.sendMail(mailOptions);
    res.redirect('/invite?success=true');
  } catch (err) {
    console.error('Error sending invite:', err);
    res.redirect('/invite?error=true');
  }
});

module.exports = router;
