const express = require('express');
const router = express.Router();

// Temporary mock data for testing
const mockMessages = [
  { _id: '1', text: 'Hola, ¿cómo estás?' },              // Spanish
  { _id: '2', text: 'سلام، خوبی؟' },                     // Farsi
  { _id: '3', text: 'This is already in English.' },     // English
  { _id: '4', text: 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?' }                  // Punjabi (Gurmukhi)
];

router.get('/messages', (req, res) => {
  res.render('messages', { title: 'Messages', messages: mockMessages });
});

module.exports = router;