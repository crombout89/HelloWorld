const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const arrayLimit = (max) =>
  function (val) {
    return val.length <= max;
  };

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
      firstName: { type: String, trim: true, maxlength: 50 },
      lastName: { type: String, trim: true, maxlength: 50 },
      usernameColor: { type: String, default: "#000000" },
      theme: {
        type: String,
        enum: ["default", "sunset", "midnight"],
        default: "default",
      },
      bio: { type: String, maxlength: 500 },
      language: { type: String, trim: true, maxlength: 50 },
      age: { type: Number, min: 13, max: 120 },
      gender: {
        type: String,
        enum: ["male", "female", "non-binary", "prefer_not_to_say", "other"],
        default: "prefer_not_to_say",
      },
      pronouns: { type: String, maxlength: 50 },
      location: {
        address: {
          city: { type: String, trim: true, maxlength: 100 },
          country: { type: String, trim: true, maxlength: 100 },
          latitude: { type: Number, min: -90, max: 90 },
          longitude: { type: Number, min: -180, max: 180 },
          public: { type: Boolean, default: true },
        },
      },
      interests: {
        type: [String],
        validate: [arrayLimit(10), "Interests cannot exceed 10"],
      },
      tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
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
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
      return next(error);
    }
  }

  if (
    this.profile?.location?.address &&
    typeof this.profile.location.address.latitude === "number" &&
    typeof this.profile.location.address.longitude === "number"
  ) {
    this.geolocation = {
      type: "Point",
      coordinates: [
        this.profile.location.address.longitude,
        this.profile.location.address.latitude,
      ],
    };
  } else {
    this.geolocation = undefined;
  }

  this.updatedAt = Date.now();
  next();
});

UserSchema.methods.updateLocation = function (locationData) {
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
      longitude: locationData.longitude,
    };
    this.geolocation = {
      type: "Point",
      coordinates: [locationData.longitude, locationData.latitude],
    };
  }
  return this.save();
};

UserSchema.index({ geolocation: "2dsphere" });

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName || ""} ${this.profile.lastName || ""}`.trim();
});

UserSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

UserSchema.statics.findNearbyUsers = function (
  latitude,
  longitude,
  maxDistance = 10
) {
  const distanceInMeters = maxDistance * 1000;
  return this.find({
    geolocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: distanceInMeters,
      },
    },
  });
};

UserSchema.index({ username: 1, email: 1 });

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
