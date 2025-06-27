const axios = require('axios');

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

    try {
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
      return this.amadeusToken;
    } catch (error) {
      throw new Error(`Amadeus authentication failed: ${error.message}`);
    }
  }

  // Search hotels using Amadeus API
  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5, radiusUnit = 'KM') {
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

      return response.data.data.map(hotel => ({
        hotelId: hotel.hotelId,
        name: hotel.name,
        lat: hotel.geoCode?.latitude,
        lon: hotel.geoCode?.longitude,
        address: hotel.address,
        distance: hotel.distance?.value,
        distanceUnit: hotel.distance?.unit
      }));
    } catch (error) {
      throw new Error(`Hotel search failed: ${error.message}`);
    }
  }

  // Get hotel offers using Amadeus API
  async getHotelOffers(hotelIds, checkInDate, checkOutDate, adults = 1, roomQuantity = 1) {
    try {
      const token = await this.getAmadeusToken();
      
      const response = await axios.get(`${this.amadeusBaseUrl}/shopping/hotel-offers`, {
        params: {
          hotelIds: Array.isArray(hotelIds) ? hotelIds.join(',') : hotelIds,
          checkInDate,
          checkOutDate,
          adults,
          roomQuantity,
          currency: 'USD'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.data.map(hotel => ({
        hotelId: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        offers: hotel.offers.map(offer => ({
          id: offer.id,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          roomType: offer.room?.type,
          price: {
            total: offer.price?.total,
            currency: offer.price?.currency,
            base: offer.price?.base
          },
          policies: offer.policies
        }))
      }));
    } catch (error) {
      throw new Error(`Hotel offers search failed: ${error.message}`);
    }
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
}

module.exports = new MapService();
