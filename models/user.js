const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      language: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      bio: {
        type: String,
        maxlength: 500,
      },
      location: {
        address: {
          type: String,
          trim: true,
          maxlength: 200,
        },
        city: {
          type: String,
          trim: true,
          maxlength: 100,
        },
        country: {
          type: String,
          trim: true,
          maxlength: 100,
        },
        coordinates: {
          latitude: {
            type: Number,
            min: -90,
            max: 90,
          },
          longitude: {
            type: Number,
            min: -180,
            max: 180,
          },
        },
      },
      interests: {
        type: [String],
        validate: {
          validator: function (v) {
            return v.length <= 10;
          },
          message: "Interests cannot exceed 10",
        },
      },
      preferences: {
        type: [String],
        default: [],
        validate: {
          validator: function (prefs) {
            return prefs.every(
              (p) => typeof p === "string" && p.trim().length > 0
            );
          },
          message: "Preferences must be non-empty strings",
        },
      },
      profilePicture: {
        type: String,
        default: "/default-profile.png",
      },
    },
    geolocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
      return next(error);
    }
  }

  if (
    this.profile &&
    this.profile.location &&
    this.profile.location.coordinates &&
    typeof this.profile.location.coordinates.latitude === "number" &&
    typeof this.profile.location.coordinates.longitude === "number"
  ) {
    this.geolocation = {
      type: "Point",
      coordinates: [
        this.profile.location.coordinates.longitude,
        this.profile.location.coordinates.latitude
      ]
    };
  } else {
    this.geolocation = undefined;
  }

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

// Validation for preferences
UserSchema.path('profile.preferences').validate(function(prefs) {
  return prefs.every(p => p.trim().length > 0);
}, 'Preferences must be non-empty strings');

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

// Method to find nearby users
UserSchema.statics.findNearbyUsers = function(latitude, longitude, maxDistance = 10) {
  const distanceInMeters = maxDistance * 1000;
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

// Compound index
UserSchema.index({ username: 1, email: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
