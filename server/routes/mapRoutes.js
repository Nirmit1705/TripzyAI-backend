const express = require('express');
const asyncHandler = require('express-async-handler');
const mapService = require('../services/mapService');

const router = express.Router();

// @desc    Geocode an address
// @route   GET /api/map/geocode
// @access  Public
router.get('/geocode', asyncHandler(async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }

  const result = await mapService.geocode(address);
  res.json(result);
}));

// @desc    Reverse geocode coordinates
// @route   GET /api/map/reverse-geocode
// @access  Public
router.get('/reverse-geocode', asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const result = await mapService.reverseGeocode(parseFloat(lat), parseFloat(lon));
  res.json(result);
}));

// @desc    Search for places
// @route   GET /api/map/search
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  const { query, lat, lon, radius } = req.query;
  
  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const places = await mapService.searchPlaces(
    query,
    lat ? parseFloat(lat) : null,
    lon ? parseFloat(lon) : null,
    radius ? parseInt(radius) : undefined
  );
  
  res.json(places);
}));

// @desc    Calculate distance between two points
// @route   GET /api/map/distance
// @access  Public
router.get('/distance', asyncHandler(async (req, res) => {
  const { lat1, lon1, lat2, lon2 } = req.query;
  
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    res.status(400);
    throw new Error('All coordinates (lat1, lon1, lat2, lon2) are required');
  }

  const distance = mapService.calculateDistance(
    parseFloat(lat1),
    parseFloat(lon1),
    parseFloat(lat2),
    parseFloat(lon2)
  );
  
  res.json({ distance: Math.round(distance * 100) / 100 }); // Round to 2 decimal places
}));

// @desc    Get tile server configuration
// @route   GET /api/map/config
// @access  Public
router.get('/config', (req, res) => {
  res.json({
    tileServer: mapService.getTileServerUrl(),
    attribution: '© OpenStreetMap contributors'
  });
});

// @desc    Search hotels by city
// @route   GET /api/map/hotels
// @access  Public
router.get('/hotels', asyncHandler(async (req, res) => {
  const { cityCode, checkInDate, checkOutDate, adults, radius } = req.query;
  
  if (!cityCode || !checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('cityCode, checkInDate, and checkOutDate are required');
  }

  const hotels = await mapService.searchHotels(
    cityCode,
    checkInDate,
    checkOutDate,
    adults ? parseInt(adults) : 1,
    radius ? parseInt(radius) : 5
  );
  
  res.json(hotels);
}));

// @desc    Get hotel offers
// @route   GET /api/map/hotel-offers
// @access  Public
router.get('/hotel-offers', asyncHandler(async (req, res) => {
  const { hotelIds, checkInDate, checkOutDate, adults, roomQuantity } = req.query;
  
  if (!hotelIds || !checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('hotelIds, checkInDate, and checkOutDate are required');
  }

  const offers = await mapService.getHotelOffers(
    hotelIds,
    checkInDate,
    checkOutDate,
    adults ? parseInt(adults) : 1,
    roomQuantity ? parseInt(roomQuantity) : 1
  );
  
  res.json(offers);
}));

module.exports = router;
