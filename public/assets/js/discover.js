document.addEventListener('DOMContentLoaded', () => {
    const discoveryGrid = document.getElementById('discoveryGrid');
    const searchModal = document.getElementById('searchModal');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModal');

    discoveryGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.discovery-card');
        if (!card) return;

        const searchType = card.dataset.searchType;
        openSearchModal(searchType);
    });

    function openSearchModal(type) {
        let modalHTML = '';

        switch(type) {
            case 'search-by-location':
                modalHTML = `
                    <h2>Search by Location</h2>
                    <form id="locationSearchForm">
                        <input 
                            type="text" 
                            name="location" 
                            placeholder="Enter city or address" 
                            required
                        >
                        <button type="submit">Search</button>
                    </form>
                `;
                break;
            case 'near-me':
                modalHTML = `
                    <h2>Events Near Me</h2>
                    <button id="findLocationBtn">Use My Location</button>
                `;
                break;
            // Add more cases for other search types
            default:
                modalHTML = `<h2>${type.replace('-', ' ').toUpperCase()}</h2>`;
        }

        modalContent.innerHTML = modalHTML;
        searchModal.style.display = 'flex';

        // Add event listeners for modal-specific interactions
        if (type === 'near-me') {
            const findLocationBtn = document.getElementById('findLocationBtn');
            findLocationBtn.addEventListener('click', findCurrentLocation);
        }

        if (type === 'search-by-location') {
            const locationSearchForm = document.getElementById('locationSearchForm');
            locationSearchForm.addEventListener('submit', handleLocationSearch);
        }
    }

    function findCurrentLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Send coordinates to backend or handle directly
                    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                },
                (error) => {
                    console.error('Error getting location', error);
                    alert('Could not retrieve your location');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    }

    function handleLocationSearch(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const location = formData.get('location');

        // Send location to backend or handle search
        console.log('Searching for location:', location);
    }

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        searchModal.style.display = 'none';
    });
});