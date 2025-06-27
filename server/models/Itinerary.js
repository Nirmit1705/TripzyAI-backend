const mongoose = require('mongoose');

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
  destination: {
    type: String,
    required: true
  },
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
  days: [{
    day: Number,
    date: Date,
    activities: [{
      time: String,
      activity: String,
      location: String,
      cost: Number,
      notes: String
    }],
    accommodation: {
      name: String,
      address: String,
      cost: Number
    },
    meals: [{
      type: String, // breakfast, lunch, dinner
      restaurant: String,
      cost: Number
    }]
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  weather: [{
    date: Date,
    condition: String,
    temperature: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
