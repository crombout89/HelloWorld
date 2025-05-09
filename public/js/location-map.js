// Define global variables
let map;
let marker;
let geocoder;
let autocomplete;
const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// IMPORTANT: Define initMap as a global function without wrapping it in document.ready
// This ensures it's available immediately when Google Maps API loads
function initMap() {
    // Initialize the geocoder for address lookup
    geocoder = new google.maps.Geocoder();

    // Initialize the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true
    });

    // Add event listeners for marker drag events
    marker.addListener('dragend', () => {
        const position = marker.getPosition();
        const latLng = {
            lat: position.lat(),
            lng: position.lng()
        };
        geocodePosition(latLng);
    });

    // Add click event listener to the map
    map.addListener('click', (event) => {
        if (marker.position) {
            marker.position = event.latLng;
        } else if (marker.setPosition) {
            marker.setPosition(event.latLng);
        }
        
        const latLng = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        geocodePosition(latLng);
    });

    // Initialize autocomplete for the location input
    const locationInput = document.getElementById('event-location');
    if (locationInput) {
        autocomplete = new google.maps.places.Autocomplete(locationInput);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                map.setCenter(place.geometry.location);
                
                if (marker.position) {
                    marker.position = place.geometry.location;
                } else if (marker.setPosition) {
                    marker.setPosition(place.geometry.location);
                }
                
                updateLocationFields(place);
            }
        });
    }

    // Set up event listeners for buttons after the map is loaded
    setupLocationButtons();
    
    console.log("Map initialized successfully");
}

// Explicitly make initMap available globally
window.initMap = initMap;

// Set up location buttons
function setupLocationButtons() {
    // Use my location button
    const useMyLocationBtn = document.getElementById('use-my-location');
    if (useMyLocationBtn) {
        useMyLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        map.setCenter(userLocation);
                        
                        if (marker.position) {
                            marker.position = userLocation;
                        } else if (marker.setPosition) {
                            marker.setPosition(userLocation);
                        }
                        
                        geocodePosition(userLocation);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        alert('Unable to get your location. Please check your browser settings.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }

    // Reset map button
    const resetMapBtn = document.getElementById('reset-map');
    if (resetMapBtn) {
        resetMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            map.setCenter(defaultLocation);
            
            if (marker.position) {
                marker.position = defaultLocation;
            } else if (marker.setPosition) {
                marker.setPosition(defaultLocation);
            }
            
            geocodePosition(defaultLocation);
        });
    }
}

// Function to geocode position and update fields
function geocodePosition(latLng) {
    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const place = {
                geometry: {
                    location: latLng
                },
                formatted_address: results[0].formatted_address,
                name: results[0].name || '',
                place_id: results[0].place_id || ''
            };
            updateLocationFields(place);
        } else {
            // If geocoding fails, still update the fields with coordinates
            updateLocationFields({
                geometry: {
                    location: latLng
                },
                formatted_address: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
                name: '',
                place_id: ''
            });
        }
    });
}

// Function to update location fields in the form
function updateLocationFields(place) {
    if (!place || !place.geometry || !place.geometry.location) {
        console.error('Invalid place object:', place);
        return;
    }
    
    const location = place.geometry.location;
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    const formattedAddress = place.formatted_address || '';
    
    const locationInput = document.getElementById('event-location');
    const latInput = document.getElementById('location-lat');
    const lngInput = document.getElementById('location-lng');
    const formattedInput = document.getElementById('location-formatted');
    const nameInput = document.getElementById('location-name');
    const placeIdInput = document.getElementById('location-place-id');
    
    if (locationInput) locationInput.value = formattedAddress;
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    if (formattedInput) formattedInput.value = formattedAddress;
    if (nameInput) nameInput.value = place.name || '';
    if (placeIdInput) placeIdInput.value = place.place_id || '';
    
    console.log('Updated location fields:', {
        lat: lat,
        lng: lng,
        address: formattedAddress
    });
}

// Add remaining event handlers after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up additional map handlers');
    
    // Handle map resizing when the window is resized
    window.addEventListener('resize', () => {
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    });
    
    // Observe changes to map container visibility
    const mapContainer = document.getElementById('location-map-container');
    if (mapContainer && map) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    mapContainer.style.display !== 'none') {
                    google.maps.event.trigger(map, 'resize');
                    if (marker && marker.getPosition) {
                        map.setCenter(marker.getPosition());
                    } else if (marker && marker.position) {
                        map.setCenter(marker.position);
                    }
                }
            });
        });
        
        observer.observe(mapContainer, { attributes: true });
    }
});

console.log('location-map.js loaded, initMap function is ready');