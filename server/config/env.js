const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  HOTEL_API_KEY: process.env.HOTEL_API_KEY,
  HOTEL_API_PASSWORD: process.env.HOTEL_API_PASSWORD,
  OSM_NOMINATIM_URL: process.env.OSM_NOMINATIM_URL,
  OSM_TILE_SERVER: process.env.OSM_TILE_SERVER
};
