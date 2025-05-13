const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    // Basic Event Information
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true,
        minlength: [20, 'Description must be at least 20 characters'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Event category is required'],
        enum: [
            'Music', 
            'Sports', 
            'Arts & Theater', 
            'Food & Drink', 
            'Technology', 
            'Professional', 
            'Other'
        ]
    },

    // Date and Time Information
    date: {
        type: Date,
        required: [true, 'Event date is required'],
        validate: {
            validator: function(v) {
                return v > new Date(); // Ensure future date
            },
            message: 'Event date must be in the future'
        }
    },
    time: {
        type: String,
        required: [true, 'Event time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },

    // Updated Location Information
    location: {
        type: String,
        required: [true, 'Event location is required'],
        trim: true,
        minlength: [3, 'Location must be at least 3 characters']
    },
    locationLat: {
        type: Number,
        required: [true, 'Location latitude is required']
    },
    locationLng: {
        type: Number,
        required: [true, 'Location longitude is required']
    },
    locationFormatted: {
        type: String,
        trim: true
    },
    locationName: {
        type: String,
        trim: true
    },
    locationPlaceId: {
        type: String,
        trim: true
    },
    // Keep the GeoJSON data for geo-queries
    locationGeoJSON: {
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

    // Organizer and Participants
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer is required']
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Event Capacity and Pricing
    capacity: {
        type: Number,
        min: [0, 'Capacity cannot be negative'],
        default: 0 // Unlimited if 0
    },
    remainingCapacity: {
        type: Number,
        default: function() {
            return this.capacity;
        }
    },
    isFullyBooked: {
        type: Boolean,
        default: false
    },

    // Optional Pricing
    price: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD']
    },

    // Media and Additional Details
    eventImage: {
        type: String, // Store image path or URL
        default: '/default-event-image.jpg'
    },

    // Event Status and Visibility
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Cancelled'],
        default: 'Draft'
    },
    isPublic: {
        type: Boolean,
        default: true
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Add virtuals, toJSON, and other schema options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
EventSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Pre-save middleware
EventSchema.pre('save', function(next) {
    // Update timestamp
    this.updatedAt = Date.now();

    // Update GeoJSON from lat/lng for geo-queries
    if (this.locationLat && this.locationLng) {
        this.locationGeoJSON = {
            type: 'Point',
            coordinates: [this.locationLng, this.locationLat] // GeoJSON uses [lng, lat] order
        };
    }

    // Check booking capacity
    if (this.capacity > 0 && this.remainingCapacity === 0) {
        this.isFullyBooked = true;
    }

    next();
});

// Instance method to check if user can join
EventSchema.methods.canUserJoin = function(userId) {
    // Check if event is public, not fully booked, and user not already a participant
    return this.isPublic && 
           !this.isFullyBooked && 
           !this.participants.includes(userId);
};

// Static method to find nearby events
EventSchema.statics.findNearby = function(longitude, latitude, maxDistance) {
    return this.find({
        'locationGeoJSON': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance || 10000 // Default 10km
            }
        }
    });
};

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;