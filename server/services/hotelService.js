const axios = require('axios');

class HotelService {
  constructor() {
    this.apiKey = process.env.HOTEL_API_KEY;
  }

  async searchHotels(location, checkIn, checkOut, budget) {
    // Implementation for hotel search
    return { message: 'Hotel service implementation needed' };
  }

  async getHotelDetails(hotelId) {
    // Implementation for hotel details
    return { message: 'Hotel details implementation needed' };
  }
}

module.exports = new HotelService();
