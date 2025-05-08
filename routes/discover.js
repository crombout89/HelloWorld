const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('discover', { 
        title: 'Discover Events',
        discoveryOptions: [
            {
                icon: 'map-pin',
                title: 'Search by Location',
                description: 'Enter a city or address'
            },
            {
                icon: 'locate',
                title: 'Near Me',
                description: 'Use current location'
            },
            {
                icon: 'calendar',
                title: 'Upcoming Events', 
                description: 'Browse all upcoming events'
            },
            {
                icon: 'music',
                title: 'Music Events',
                description: 'Concerts, festivals, live music'
            },
            {
                icon: 'theater',
                title: 'Arts & Theater',
                description: 'Plays, exhibitions, performances'
            },
            {
                icon: 'football',
                title: 'Sports',
                description: 'Games, matches, tournaments'
            }
        ]
    });
});

module.exports = router;