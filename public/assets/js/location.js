// public/js/location.js
(function(global) {
  class LocationService {
      // Get current location with more detailed error handling
      static async getCurrentLocation() {
          return new Promise((resolve, reject) => {
              if ("geolocation" in navigator) {
                  // Add timeout and improved options
                  const options = {
                      enableHighAccuracy: true,
                      timeout: 5000,
                      maximumAge: 0
                  };

                  navigator.geolocation.getCurrentPosition(
                      position => {
                          console.log('Location retrieved successfully:', position.coords);
                          resolve({
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude,
                              accuracy: position.coords.accuracy
                          });
                      },
                      error => {
                          console.error('Geolocation error:', error);
                          switch(error.code) {
                              case error.PERMISSION_DENIED:
                                  reject(new Error("User denied location access"));
                                  break;
                              case error.POSITION_UNAVAILABLE:
                                  reject(new Error("Location information unavailable"));
                                  break;
                              case error.TIMEOUT:
                                  reject(new Error("Location request timed out"));
                                  break;
                              default:
                                  reject(new Error("Unknown location error"));
                          }
                      },
                      options
                  );
              } else {
                  reject(new Error("Geolocation not supported by this browser"));
              }
          });
      }

      // Find nearby users with more flexible parameters
      static async findNearbyUsers(options = {}) {
          const { 
              maxDistance = 10, 
              minAge = null, 
              interests = [] 
          } = options;

          try {
              const { latitude, longitude } = await this.getCurrentLocation();
              
              const queryParams = new URLSearchParams({
                  latitude,
                  longitude,
                  maxDistance,
                  ...(minAge && { minAge }),
                  ...(interests.length > 0 && { interests: interests.join(',') })
              });

              const response = await fetch(`/api/geolocation/nearby?${queryParams}`);
              
              if (!response.ok) {
                  const errorBody = await response.text();
                  throw new Error(`Failed to fetch nearby users: ${errorBody}`);
              }

              return await response.json();
          } catch (error) {
              console.error('Nearby Users Error:', error);
              throw error;
          }
      }

      // Update user location with more flexibility
      static async updateUserLocation(locationData) {
          try {
              // Support both address string and coordinate object
              const payload = typeof locationData === 'string' 
                  ? { address: locationData }
                  : {
                      latitude: locationData.latitude,
                      longitude: locationData.longitude
                  };

              const response = await fetch('/api/geolocation/update-location', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) {
                  const errorBody = await response.text();
                  throw new Error(`Failed to update location: ${errorBody}`);
              }

              return await response.json();
          } catch (error) {
              console.error('Location Update Error:', error);
              throw error;
          }
      }

      // Additional utility method for watching location
      static watchLocation(callback, options = {}) {
          if ("geolocation" in navigator) {
              const watchId = navigator.geolocation.watchPosition(
                  position => {
                      console.log('Location updated:', position.coords);
                      callback({
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                          accuracy: position.coords.accuracy
                      });
                  },
                  error => {
                      console.error('Location watch error:', error);
                      callback(null, error);
                  },
                  {
                      enableHighAccuracy: true,
                      timeout: 5000,
                      maximumAge: 0,
                      ...options
                  }
              );

              // Return a method to clear the watch
              return () => navigator.geolocation.clearWatch(watchId);
          } else {
              console.error('Geolocation not supported');
              return null;
          }
      }

      // Method to check if location is supported
      static isLocationSupported() {
          return "geolocation" in navigator;
      }
  }

  // Optional: Add error handling wrapper
  function handleLocationError(error, fallbackFn = null) {
    const locationErrorMap = {
        "User denied location access": "Please enable location permissions",
        "Location information unavailable": "Unable to retrieve location",
        "Location request timed out": "Location request took too long",
        "Geolocation not supported by this browser": "Your browser doesn't support location services"
    };

    const userFriendlyMessage = locationErrorMap[error.message] || "An unknown location error occurred";
    
    console.error('Location Error:', error);
    
    if (fallbackFn && typeof fallbackFn === 'function') {
        fallbackFn(userFriendlyMessage);
    }

    alert(userFriendlyMessage);
}

// Expose to global scope
global.LocationService = LocationService;
global.handleLocationError = handleLocationError;
})(typeof window !== 'undefined' ? window : this);