document.addEventListener('DOMContentLoaded', () => {
    const getLocationBtn = document.getElementById('get-location-btn');
    const discoverUsersBtn = document.getElementById('discover-users-btn');
    const nearbyUsersList = document.getElementById('nearby-users-list');
    const locationStatus = document.getElementById('location-status');
    
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async () => {
            try {
                const location = await LocationService.getCurrentLocation();
                
                const response = await fetch('/api/geolocation/update-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        latitude: location.latitude,
                        longitude: location.longitude
                    })
                });

                // Improved error handling
                if (!response.ok) {
                    const errorResponse = await response.json();
                    throw new Error(errorResponse.message || 'Failed to update location');
                }

                const result = await response.json();
                console.log('Location update result:', result);

                // Update location status
                if (locationStatus) {
                    locationStatus.textContent = `Location: ${result.location.coordinates.latitude}, ${result.location.coordinates.longitude}`;
                }

                // Optional: Soft update instead of full page reload
                // window.location.reload();
            } catch (error) {
                console.error('Location error:', error);
                
                // Use custom error handler or fallback to alert
                if (typeof handleLocationError === 'function') {
                    handleLocationError(error);
                } else {
                    alert(error.message || 'An error occurred while getting location');
                }
            }
        });
    }

    if (discoverUsersBtn && nearbyUsersList) {
        discoverUsersBtn.addEventListener('click', async () => {
            try {
                // Get current user's location first
                const location = await LocationService.getCurrentLocation();

                const response = await fetch(`/api/geolocation/nearby?latitude=${location.latitude}&longitude=${location.longitude}`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    const errorResponse = await response.json();
                    throw new Error(errorResponse.message || 'Failed to find nearby users');
                }

                const { users } = await response.json();

                // Clear previous results
                nearbyUsersList.innerHTML = '';

                if (users.length === 0) {
                    nearbyUsersList.innerHTML = '<p>No nearby users found.</p>';
                    return;
                }

                // Populate nearby users
                users.forEach(user => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('nearby-user', 'p-2', 'border', 'rounded', 'mb-2');
                    userElement.innerHTML = `
                        <p class="font-bold">${user.username || 'Anonymous User'}</p>
                        <p>Distance: ${user.distance ? user.distance.toFixed(2) + ' km' : 'Unknown'}</p>
                    `;
                    nearbyUsersList.appendChild(userElement);
                });
            } catch (error) {
                console.error('Error finding nearby users:', error);
                nearbyUsersList.innerHTML = `
                    <div class="text-red-500 p-2">
                        <p>Error: ${error.message}</p>
                        <p>Could not retrieve nearby users</p>
                    </div>
                `;
            }
        });
    }
});