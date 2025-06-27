const axios = require('axios');
const currencyService = require('./currencyService');

class MapService {
  constructor() {
    this.nominatimUrl = process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
    this.tileServer = process.env.OSM_TILE_SERVER || 'https://tile.openstreetmap.org';
    this.amadeusApiKey = process.env.HOTEL_API_KEY;
    this.amadeusApiSecret = process.env.HOTEL_API_PASSWORD;
    this.amadeusBaseUrl = 'https://api.amadeus.com/v1';
    this.amadeusToken = null;
    this.tokenExpiry = null;
  }

  // Get Amadeus access token
  async getAmadeusToken() {
    if (this.amadeusToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.amadeusToken;
    }

    // Check if credentials are available
    if (!this.amadeusApiKey || !this.amadeusApiSecret) {
      throw new Error('Amadeus API credentials not configured. Please set HOTEL_API_KEY and HOTEL_API_PASSWORD in environment variables.');
    }

    try {
      console.log('Attempting Amadeus authentication...');
      const response = await axios.post('https://api.amadeus.com/v1/security/oauth2/token', 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.amadeusApiKey,
          client_secret: this.amadeusApiSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.amadeusToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      console.log('Amadeus authentication successful');
      return this.amadeusToken;
    } catch (error) {
      console.error('Amadeus authentication error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error(`Amadeus authentication failed: Invalid API credentials. Please verify HOTEL_API_KEY and HOTEL_API_PASSWORD.`);
      }
      
      throw new Error(`Amadeus authentication failed: ${error.message}`);
    }
  }

  // Search hotels using Amadeus API with basic pricing
  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, radiusUnit = 'KM', targetCurrency = 'USD') {
    // Check if credentials are available
    const mockMode = !this.amadeusApiKey || !this.amadeusApiSecret;
    
    if (mockMode) {
      console.log('Running in mock mode for hotel search (no credentials)...');
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }

    try {
      const token = await this.getAmadeusToken();
      
      const response = await axios.get(`${this.amadeusBaseUrl}/reference-data/locations/hotels/by-city`, {
        params: {
          cityCode,
          radius,
          radiusUnit,
          hotelSource: 'ALL'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Add basic pricing estimates and convert currency if needed
      const hotelsWithPricing = await Promise.all(response.data.data.map(async (hotel) => {
        // Generate basic pricing estimate based on hotel data
        const basePriceUSD = this.estimateHotelPrice(hotel);
        
        let convertedPrice = basePriceUSD;
        if (targetCurrency !== 'USD') {
          try {
            convertedPrice = await currencyService.convertCurrency(basePriceUSD, 'USD', targetCurrency);
          } catch (error) {
            console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
          }
        }

        return {
          hotelId: hotel.hotelId,
          name: hotel.name,
          lat: hotel.geoCode?.latitude,
          lon: hotel.geoCode?.longitude,
          address: hotel.address,
          distance: hotel.distance?.value,
          distanceUnit: hotel.distance?.unit,
          estimatedPrice: {
            amount: convertedPrice,
            currency: targetCurrency,
            originalAmount: basePriceUSD,
            originalCurrency: 'USD',
            perNight: true
          }
        };
      }));

      return hotelsWithPricing;
    } catch (error) {
      console.warn('Amadeus API failed, falling back to mock mode:', error.message);
      // Fall back to mock mode if API fails
      return this.getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency);
    }
  }

  // Generate mock hotels with pricing for testing
  async getMockHotels(cityCode, checkInDate, checkOutDate, adults, targetCurrency) {
    console.log(`Generating mock hotels for ${cityCode} in ${targetCurrency}`);
    
    const cityCoordinates = this.getCityCoordinates(cityCode);
    
    const mockHotels = [
      {
        hotelId: `MOCK_${cityCode}_001`,
        name: `Grand Hotel ${cityCode}`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`123 Main Street, ${cityCode}`],
          postalCode: '12345',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 2.5, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_002`,
        name: `Luxury Resort ${cityCode}`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`456 Resort Boulevard, ${cityCode}`],
          postalCode: '12346',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 5.2, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_003`,
        name: `Budget Inn ${cityCode}`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`789 Economy Street, ${cityCode}`],
          postalCode: '12347',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 1.8, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_004`,
        name: `Business Hotel ${cityCode}`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`321 Business District, ${cityCode}`],
          postalCode: '12348',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 3.1, unit: 'KM' },
        distanceUnit: 'KM'
      },
      {
        hotelId: `MOCK_${cityCode}_005`,
        name: `Boutique Hotel ${cityCode}`,
        lat: cityCoordinates.lat + (Math.random() - 0.5) * 0.02,
        lon: cityCoordinates.lon + (Math.random() - 0.5) * 0.02,
        address: {
          lines: [`654 Boutique Avenue, ${cityCode}`],
          postalCode: '12349',
          cityName: cityCode,
          countryCode: cityCoordinates.country
        },
        distance: { value: 4.7, unit: 'KM' },
        distanceUnit: 'KM'
      }
    ];

    // Add pricing estimates and currency conversion
    const hotelsWithPricing = await Promise.all(mockHotels.map(async (hotel) => {
      const basePriceUSD = this.estimateHotelPrice(hotel);
      
      let convertedPrice = basePriceUSD;
      if (targetCurrency !== 'USD') {
        try {
          convertedPrice = await currencyService.convertCurrency(basePriceUSD, 'USD', targetCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
        }
      }

      return {
        ...hotel,
        estimatedPrice: {
          amount: Math.round(convertedPrice * 100) / 100,
          currency: targetCurrency,
          originalAmount: basePriceUSD,
          originalCurrency: 'USD',
          perNight: true
        },
        mockData: true
      };
    }));

    return hotelsWithPricing;
  }

  // Get approximate coordinates for common city codes
  getCityCoordinates(cityCode) {
    const cityMap = {
      'PAR': { lat: 48.8566, lon: 2.3522, country: 'FR' },
      'LON': { lat: 51.5074, lon: -0.1278, country: 'GB' },
      'NYC': { lat: 40.7128, lon: -74.0060, country: 'US' },
      'TYO': { lat: 35.6762, lon: 139.6503, country: 'JP' },
      'BER': { lat: 52.5200, lon: 13.4050, country: 'DE' },
      'ROM': { lat: 41.9028, lon: 12.4964, country: 'IT' },
      'MAD': { lat: 40.4168, lon: -3.7038, country: 'ES' },
      'BCN': { lat: 41.3851, lon: 2.1734, country: 'ES' },
      'AMS': { lat: 52.3676, lon: 4.9041, country: 'NL' },
      'ZUR': { lat: 47.3769, lon: 8.5417, country: 'CH' }
    };

    return cityMap[cityCode] || { lat: 48.8566, lon: 2.3522, country: 'FR' }; // Default to Paris
  }

  // Estimate hotel price based on name and location
  estimateHotelPrice(hotel) {
    const hotelName = hotel.name.toLowerCase();
    let basePrice = 120; // Default price

    // Price estimation based on hotel name keywords
    if (hotelName.includes('luxury') || hotelName.includes('grand') || hotelName.includes('resort')) {
      basePrice = 300 + Math.floor(Math.random() * 200);
    } else if (hotelName.includes('budget') || hotelName.includes('inn') || hotelName.includes('hostel')) {
      basePrice = 60 + Math.floor(Math.random() * 60);
    } else if (hotelName.includes('boutique') || hotelName.includes('premium')) {
      basePrice = 200 + Math.floor(Math.random() * 150);
    } else {
      basePrice = 100 + Math.floor(Math.random() * 100);
    }

    return Math.round(basePrice);
  }

  // Remove the complex getHotelOffers method and replace with simple version
  async getHotelDetails(hotelIds, targetCurrency = 'USD') {
    const hotelIdArray = Array.isArray(hotelIds) ? hotelIds : hotelIds.split(',');
    
    return hotelIdArray.map(hotelId => {
      const basePrice = 150 + Math.floor(Math.random() * 200);
      
      return {
        hotelId,
        name: `Hotel ${hotelId}`,
        rating: 3 + Math.floor(Math.random() * 2),
        amenities: ['WiFi', 'Restaurant', 'Gym', 'Pool'],
        description: 'A comfortable hotel with modern amenities and excellent service.',
        estimatedPrice: {
          amount: basePrice,
          currency: targetCurrency,
          perNight: true
        }
      };
    });
  }

  // Geocode address to coordinates
  async geocode(address) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      if (response.data.length === 0) {
        throw new Error('Address not found');
      }

      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address
      };
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      return {
        display_name: response.data.display_name,
        address: response.data.address
      };
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  // Search for places (restaurants, hotels, attractions)
  async searchPlaces(query, lat, lon, radius = 5000) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 20,
          addressdetails: 1,
          bounded: 1,
          viewbox: this.getBoundingBox(lat, lon, radius)
        },
        headers: {
          'User-Agent': 'TripzyAI/1.0'
        }
      });

      return response.data.map(place => ({
        name: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        type: place.type,
        category: place.category,
        address: place.address
      }));
    } catch (error) {
      throw new Error(`Place search failed: ${error.message}`);
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper method to convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Helper method to create bounding box for search
  getBoundingBox(lat, lon, radiusInMeters) {
    const latDelta = radiusInMeters / 111320; // meters to degrees latitude
    const lonDelta = radiusInMeters / (111320 * Math.cos(this.toRadians(lat))); // meters to degrees longitude
    
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;
    
    return `${minLon},${minLat},${maxLon},${maxLat}`;
  }

  // Get tile server URL for frontend map rendering
  getTileServerUrl() {
    return this.tileServer;
  }

  // Plan optimal route for multiple destinations
  async planMultiDestinationRoute(initialLocation, destinations) {
    try {
      const allLocations = [initialLocation, ...destinations];
      const routeMatrix = [];
      
      // Calculate distances between all locations
      for (let i = 0; i < allLocations.length; i++) {
        routeMatrix[i] = [];
        for (let j = 0; j < allLocations.length; j++) {
          if (i === j) {
            routeMatrix[i][j] = 0;
          } else {
            const distance = this.calculateDistance(
              allLocations[i].coordinates.lat,
              allLocations[i].coordinates.lon,
              allLocations[j].coordinates.lat,
              allLocations[j].coordinates.lon
            );
            routeMatrix[i][j] = distance;
          }
        }
      }

      // Simple nearest neighbor algorithm for route optimization
      const optimizedRoute = this.optimizeRoute(routeMatrix, 0); // Start from initial location
      
      return {
        originalLocations: allLocations,
        optimizedOrder: optimizedRoute,
        optimizedLocations: optimizedRoute.map(index => allLocations[index]),
        totalDistance: this.calculateTotalDistance(routeMatrix, optimizedRoute)
      };
    } catch (error) {
      throw new Error(`Multi-destination route planning failed: ${error.message}`);
    }
  }

  // Simple route optimization using nearest neighbor
  optimizeRoute(distanceMatrix, startIndex = 0) {
    const numLocations = distanceMatrix.length;
    const visited = new Array(numLocations).fill(false);
    const route = [startIndex];
    visited[startIndex] = true;
    
    let currentLocation = startIndex;
    
    for (let i = 1; i < numLocations; i++) {
      let nearestDistance = Infinity;
      let nearestLocation = -1;
      
      for (let j = 0; j < numLocations; j++) {
        if (!visited[j] && distanceMatrix[currentLocation][j] < nearestDistance) {
          nearestDistance = distanceMatrix[currentLocation][j];
          nearestLocation = j;
        }
      }
      
      if (nearestLocation !== -1) {
        route.push(nearestLocation);
        visited[nearestLocation] = true;
        currentLocation = nearestLocation;
      }
    }
    
    return route;
  }

  // Calculate total distance for a route
  calculateTotalDistance(distanceMatrix, route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]];
    }
    return Math.round(totalDistance * 100) / 100;
  }

  // Get hotels for multiple destinations
  async getHotelsForDestinations(destinations, checkInDate, checkOutDate, adults = 1, targetCurrency = 'USD') {
    try {
      const hotelResults = [];
      
      for (const destination of destinations) {
        if (destination.cityCode) {
          const hotels = await this.searchHotels(
            destination.cityCode,
            checkInDate,
            checkOutDate,
            adults,
            5,
            'KM',
            targetCurrency
          );
          
          hotelResults.push({
            destination: destination.name,
            cityCode: destination.cityCode,
            hotels: hotels.slice(0, 10), // Limit to top 10 hotels per destination
            currency: targetCurrency
          });
        }
      }
      
      return hotelResults;
    } catch (error) {
      throw new Error(`Multi-destination hotel search failed: ${error.message}`);
    }
  }

  // Geocode multiple locations
  async geocodeMultipleLocations(locations) {
    try {
      const geocodedLocations = [];
      
      for (const location of locations) {
        if (typeof location === 'string') {
          const geocoded = await this.geocode(location);
          geocodedLocations.push({
            name: location,
            address: geocoded.display_name,
            coordinates: {
              lat: geocoded.lat,
              lon: geocoded.lon
            },
            fullData: geocoded
          });
        } else if (location.name && !location.coordinates) {
          const geocoded = await this.geocode(location.name);
          geocodedLocations.push({
            ...location,
            address: geocoded.display_name,
            coordinates: {
              lat: geocoded.lat,
              lon: geocoded.lon
            },
            fullData: geocoded
          });
        } else {
          geocodedLocations.push(location);
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return geocodedLocations;
    } catch (error) {
      throw new Error(`Multiple location geocoding failed: ${error.message}`);
    }
  }
}

module.exports = new MapService();
