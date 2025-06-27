const asyncHandler = require('express-async-handler');
const mapService = require('../services/mapService');

// @desc    Geocode an address
// @route   GET /api/map/geocode
// @access  Public
const geocodeAddress = asyncHandler(async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }

  const result = await mapService.geocode(address);
  res.json({
    success: true,
    data: result
  });
});

// @desc    Reverse geocode coordinates
// @route   GET /api/map/reverse-geocode
// @access  Public
const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  
  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const result = await mapService.reverseGeocode(parseFloat(lat), parseFloat(lon));
  res.json({
    success: true,
    data: result
  });
});

// @desc    Search for places
// @route   GET /api/map/search
// @access  Public
const searchPlaces = asyncHandler(async (req, res) => {
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
  
  res.json({
    success: true,
    data: places,
    count: places.length
  });
});

// @desc    Calculate distance between two points
// @route   GET /api/map/distance
// @access  Public
const calculateDistance = asyncHandler(async (req, res) => {
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
  
  res.json({
    success: true,
    data: {
      distance: Math.round(distance * 100) / 100,
      unit: 'kilometers'
    }
  });
});

// @desc    Get tile server configuration
// @route   GET /api/map/config
// @access  Public
const getMapConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      tileServer: mapService.getTileServerUrl(),
      attribution: '© OpenStreetMap contributors',
      nominatimUrl: process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org'
    }
  });
});

// @desc    Search hotels by city
// @route   GET /api/map/hotels
// @access  Public
const searchHotels = asyncHandler(async (req, res) => {
  const { cityCode, checkInDate, checkOutDate, adults, radius } = req.query;
  
  if (!cityCode || !checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('cityCode, checkInDate, and checkOutDate are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
    res.status(400);
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  const hotels = await mapService.searchHotels(
    cityCode,
    checkInDate,
    checkOutDate,
    adults ? parseInt(adults) : 1,
    radius ? parseInt(radius) : 5
  );
  
  res.json({
    success: true,
    data: hotels,
    count: hotels.length,
    searchParams: {
      cityCode,
      checkInDate,
      checkOutDate,
      adults: adults ? parseInt(adults) : 1,
      radius: radius ? parseInt(radius) : 5
    }
  });
});

// @desc    Get hotel offers
// @route   GET /api/map/hotel-offers
// @access  Public
const getHotelOffers = asyncHandler(async (req, res) => {
  const { hotelIds, checkInDate, checkOutDate, adults, roomQuantity } = req.query;
  
  if (!hotelIds || !checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('hotelIds, checkInDate, and checkOutDate are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
    res.status(400);
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  const offers = await mapService.getHotelOffers(
    hotelIds,
    checkInDate,
    checkOutDate,
    adults ? parseInt(adults) : 1,
    roomQuantity ? parseInt(roomQuantity) : 1
  );
  
  res.json({
    success: true,
    data: offers,
    count: offers.length,
    searchParams: {
      hotelIds: Array.isArray(hotelIds) ? hotelIds : [hotelIds],
      checkInDate,
      checkOutDate,
      adults: adults ? parseInt(adults) : 1,
      roomQuantity: roomQuantity ? parseInt(roomQuantity) : 1
    }
  });
});

// @desc    Plan route for multiple destinations
// @route   POST /api/map/multi-destination-route
// @access  Public
const planMultiDestinationRoute = asyncHandler(async (req, res) => {
  const { initialLocation, destinations } = req.body;
  
  if (!initialLocation || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
    res.status(400);
    throw new Error('Initial location and destinations array are required');
  }

  // Geocode locations if coordinates are not provided
  const geocodedInitial = initialLocation.coordinates ? 
    initialLocation : 
    await mapService.geocodeMultipleLocations([initialLocation]).then(results => results[0]);
    
  const geocodedDestinations = await mapService.geocodeMultipleLocations(
    destinations.filter(dest => !dest.coordinates)
  );
  
  // Combine geocoded with already geocoded destinations
  const allDestinations = destinations.map(dest => {
    if (dest.coordinates) return dest;
    return geocodedDestinations.find(geo => geo.name === dest.name) || dest;
  });

  const routePlan = await mapService.planMultiDestinationRoute(geocodedInitial, allDestinations);
  
  res.json({
    success: true,
    data: routePlan
  });
});

// @desc    Geocode multiple locations
// @route   POST /api/map/geocode-multiple
// @access  Public
const geocodeMultipleLocations = asyncHandler(async (req, res) => {
  const { locations } = req.body;
  
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    res.status(400);
    throw new Error('Locations array is required');
  }

  if (locations.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 locations allowed per request');
  }

  const geocodedLocations = await mapService.geocodeMultipleLocations(locations);
  
  res.json({
    success: true,
    data: geocodedLocations,
    count: geocodedLocations.length
  });
});

// @desc    Get hotels for multiple destinations
// @route   POST /api/map/multi-destination-hotels
// @access  Public
const getMultiDestinationHotels = asyncHandler(async (req, res) => {
  const { destinations, checkInDate, checkOutDate, adults } = req.body;
  
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    res.status(400);
    throw new Error('Destinations array is required');
  }
  
  if (!checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('Check-in and check-out dates are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
    res.status(400);
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  const hotelResults = await mapService.getHotelsForDestinations(
    destinations,
    checkInDate,
    checkOutDate,
    adults ? parseInt(adults) : 1
  );
  
  res.json({
    success: true,
    data: hotelResults,
    searchParams: {
      checkInDate,
      checkOutDate,
      adults: adults ? parseInt(adults) : 1,
      destinationCount: destinations.length
    }
  });
});

module.exports = {
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  calculateDistance,
  getMapConfig,
  searchHotels,
  getHotelOffers,
  planMultiDestinationRoute,
  geocodeMultipleLocations,
  getMultiDestinationHotels
};
