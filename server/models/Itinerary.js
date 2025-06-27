const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: String,
  coordinates: {
    lat: Number,
    lon: Number
  },
  cityCode: String, // For Amadeus API
  country: String
}, { _id: false });

const itinerarySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  startingPoint: {
    type: locationSchema,
    required: true
  },
  destinations: [locationSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  originalCurrency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  days: [{
    day: Number,
    date: Date,
    currentLocation: {
      name: String,
      coordinates: {
        lat: Number,
        lon: Number
      }
    },
    activities: [{
      time: String,
      activity: String,
      location: String,
      cost: Number,
      originalCost: Number,
      currency: String,
      notes: String,
      coordinates: {
        lat: Number,
        lon: Number
      }
    }],
    accommodation: {
      name: String,
      address: String,
      cost: Number,
      originalCost: Number,
      currency: String,
      hotelId: String,
      coordinates: {
        lat: Number,
        lon: Number
      }
    },
    meals: [{
      type: String, // breakfast, lunch, dinner
      restaurant: String,
      cost: Number,
      originalCost: Number,
      currency: String,
      coordinates: {
        lat: Number,
        lon: Number
      }
    }],
    transportation: {
      from: String,
      to: String,
      mode: String, // flight, train, bus, car
      cost: Number,
      originalCost: Number,
      currency: String,
      duration: String,
      distance: Number
    }
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  optimizedRoute: [{
    order: Number,
    location: locationSchema,
    estimatedDays: Number
  }],
  weather: [{
    date: Date,
    condition: String,
    temperature: String,
    location: String
  }],
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  completedAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  userReview: String
}, {
  timestamps: true
});

// Method to check if trip is completed based on end date
itinerarySchema.methods.isCompleted = function() {
  return new Date() > this.endDate;
};

// Method to check if trip is ongoing
itinerarySchema.methods.isOngoing = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Method to check if trip is upcoming
itinerarySchema.methods.isUpcoming = function() {
  return new Date() < this.startDate;
};

// Pre-save middleware to update status based on dates
itinerarySchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status !== 'cancelled') {
    if (now > this.endDate) {
      this.status = 'completed';
      if (!this.completedAt) {
        this.completedAt = this.endDate;
      }
    } else if (now >= this.startDate && now <= this.endDate) {
      this.status = 'ongoing';
    } else if (now < this.startDate && this.status === 'draft') {
      this.status = 'confirmed';
    }
  }
  
  next();
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
