const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('discover', { 
        title: 'Discover Events',
        discoveryOptions: [
            {
                icon: 'assets/svg/search-by-location.svg',
                title: 'Search by Location',
                description: 'Enter a city or address'
            },
            {
                icon: 'assets/svg/near-me.svg',
                title: 'Near Me',
                description: 'Use current location'
            },{
                icon: 'assets/svg/near-me.svg',
                title: 'Find Friends',
                description: 'Connect with new people'
            },{
                icon: 'assets/svg/near-me.svg',
                title: 'Search by Interest',
                description: 'Virtual social groups'
            },
            {
                icon: 'assets/svg/group-events.svg',
                title: 'Community Events', 
                description: 'Browse all upcoming community events'
            }
        ]
    });
});

module.exports = router;