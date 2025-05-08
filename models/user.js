const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    bio: {
      type: String,
      maxlength: 500
    },
    location: {
      // Enhanced location object
      address: {
        type: String,
        trim: true,
        maxlength: 200
      },
      city: {
        type: String,
        trim: true,
        maxlength: 100
      },
      country: {
        type: String,
        trim: true,
        maxlength: 100
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      }
    },
    interests: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.length <= 10; // Limit number of interests
        },
        message: 'Interests cannot exceed 10'
      }
    },
    profilePicture: {
      type: String,
      default: '/default-profile.png'
    }
  },
  // Add geolocation for geospatial queries
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
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
      return next(error);
    }
  }

  // Update geolocation if coordinates are present in profile
  if (this.profile.location.coordinates.latitude && this.profile.location.coordinates.longitude) {
    this.geolocation = {
      type: 'Point',
      coordinates: [
        this.profile.location.coordinates.longitude,
        this.profile.location.coordinates.latitude
      ]
    };
  }

  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  next();
});

// Method to update location
UserSchema.methods.updateLocation = function(locationData) {
  if (locationData.address) {
    this.profile.location.address = locationData.address;
  }
  if (locationData.city) {
    this.profile.location.city = locationData.city;
  }
  if (locationData.country) {
    this.profile.location.country = locationData.country;
  }
  if (locationData.latitude && locationData.longitude) {
    this.profile.location.coordinates = {
      latitude: locationData.latitude,
      longitude: locationData.longitude
    };
    this.geolocation = {
      type: 'Point',
      coordinates: [locationData.longitude, locationData.latitude]
    };
  }
  return this.save();
};

// Add geospatial index
UserSchema.index({ geolocation: '2dsphere' });

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Validation for interests
UserSchema.path('profile.interests').validate(function(interests) {
  return interests.every(interest => interest.trim().length > 0);
}, 'Interests cannot be empty strings');

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

// Privacy method to return safe user object
UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Additional method for finding nearby users
UserSchema.statics.findNearbyUsers = function(latitude, longitude, maxDistance = 10) {
  const distanceInMeters = maxDistance * 1000; // convert km to meters
  return this.find({
    geolocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: distanceInMeters
      }
    }
  });
};

// Compound index for performance
UserSchema.index({ username: 1, email: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);