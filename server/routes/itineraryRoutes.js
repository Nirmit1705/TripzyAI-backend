const express = require('express');
const router = express.Router();
const {
  generateItinerary,
  getItineraries,
  getItinerary
} = require('../controllers/itineraryController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/generate').post(protect, generateItinerary);
router.route('/').get(protect, getItineraries);
router.route('/:id').get(protect, getItinerary);

module.exports = router;
