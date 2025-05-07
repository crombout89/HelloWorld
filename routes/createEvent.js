// routes/createEvent.js
const express = require('express');
const router = express.Router();

router.get('/create-event', (req, res) => {
  res.render('createEvent', { title: 'Create Event', error: null });
});


router.post('/create-event', async (req, res) => {
  const { eventName, eventDate, eventTime } = req.body;

  if (!eventName || !eventDate || !eventTime) {
    return res.render('createEvent', { title: 'Create Event', error: 'All fields are required' });
  }

  let locationData = null;
  try {
    locationData = await getLocationData(); // Get location data (replace with your API call)
  } catch (error) {
    console.error("Error getting location:", error);
    return res.render('createEvent', { title: 'Create Event', error: 'Could not retrieve location' });
  }

  // Combine event data and location data (handle potential null locationData)
  const eventData = {
    name: eventName,
    date: eventDate,
    time: eventTime,
    location: locationData || { error: "Location not available" }, // Provide a default if locationData is null
    // ... other event details ...
  };

  // Placeholder for saving eventData to MongoDB (replace with your database logic)
  try {
    // await saveEventToDatabase(eventData);  // Replace with your MongoDB save logic
    console.log("Event created:", eventData); // For now, just log the data
  } catch (error) {
    console.error("Error saving event:", error);
    return res.render('createEvent', { title: 'Create Event', error: 'Error saving event' });
  }


  res.redirect('/events'); // Redirect to events page (you'll need to create this route)

});

// Placeholder function for location API call (same as in profile.js - you can refactor this to a shared utility file later)
async function getLocationData() {
  // ... (same implementation as before - replace with your actual API call)
}



module.exports = router;