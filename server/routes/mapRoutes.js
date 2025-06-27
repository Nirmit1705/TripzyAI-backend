const express = require('express');
const {
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  calculateDistance,
  getMapConfig,
  searchHotels,
  getHotelDetails,
  planMultiDestinationRoute,
  geocodeMultipleLocations,
  getMultiDestinationHotels
} = require('../controllers/mapController');

const router = express.Router();

// @desc    Geocode an address
// @route   GET /api/map/geocode
// @access  Public
router.get('/geocode', geocodeAddress);

// @desc    Reverse geocode coordinates
// @route   GET /api/map/reverse-geocode
// @access  Public
router.get('/reverse-geocode', reverseGeocode);

// @desc    Search for places
// @route   GET /api/map/search
// @access  Public
router.get('/search', searchPlaces);

// @desc    Calculate distance between two points
// @route   GET /api/map/distance
// @access  Public
router.get('/distance', calculateDistance);

// @desc    Get tile server configuration
// @route   GET /api/map/config
// @access  Public
router.get('/config', getMapConfig);

// @desc    Search hotels by city
// @route   GET /api/map/hotels
// @access  Public
router.get('/hotels', searchHotels);

// @desc    Get basic hotel details
// @route   GET /api/map/hotel-details
// @access  Public
router.get('/hotel-details', getHotelDetails);

// @desc    Plan route for multiple destinations
// @route   POST /api/map/multi-destination-route
// @access  Public
router.post('/multi-destination-route', planMultiDestinationRoute);

// @desc    Geocode multiple locations
// @route   POST /api/map/geocode-multiple
// @access  Public
router.post('/geocode-multiple', geocodeMultipleLocations);

// @desc    Get hotels for multiple destinations
// @route   POST /api/map/multi-destination-hotels
// @access  Public
router.post('/multi-destination-hotels', getMultiDestinationHotels);

module.exports = router;