const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      city: String,
      country: String
    },
    interests: [String],
    profilePicture: String
  },
  geolocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to geocode address using LocationIQ
UserSchema.methods.geocodeAddress = async function(address) {
  try {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const response = await axios.get('https://us1.locationiq.com/v1/search', {
      params: {
        key: apiKey,
        q: address,
        format: 'json',
        limit: 1
      }
    });

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      
      // Update profile location
      this.profile.location = {
        address: address,
        coordinates: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        },
        city: location.address.city || location.address.town || '',
        country: location.address.country || ''
      };

      // Update geospatial index
      this.geolocation = {
        type: 'Point',
        coordinates: [
          parseFloat(location.lon), 
          parseFloat(location.lat)
        ]
      };

      return this;
    }

    throw new Error('No location found');
  } catch (error) {
    console.error('Geocoding Error:', error.message);
    throw error;
  }
};

// Static method to find users near a location
UserSchema.statics.findNearby = async function(latitude, longitude, maxDistance = 10) {
  return this.find({
    geolocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

// Create and export the model
module.exports = mongoose.model('User', UserSchema);