# TripzyAI Backend

AI-powered trip planning backend service that generates personalized travel itineraries using advanced language models.

## Features

- User authentication and profile management
- AI-powered itinerary generation with multi-destination support
- Starting point and multiple destinations planning
- Route optimization for multiple destinations
- Real-time weather integration
- Interactive AI agent for trip modifications
- Hotel search and booking via Amadeus API
- Place recommendations via OpenStreetMap
- Budget optimization
- OpenStreetMap integration for location services

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI/LLM**: Groq API
- **External APIs**: Weather API, OpenStreetMap Nominatim, Amadeus Hotel API
- **Maps**: OpenStreetMap with Leaflet (frontend)
- **Authentication**: JWT tokens

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your API keys
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### User Routes (`/api/user`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `GET /trip-history` - Get user's past completed trips
- `GET /current-trips` - Get user's current and upcoming trips
- `GET /travel-stats` - Get user's travel statistics and analytics
- `PUT /rate-trip/:id` - Rate and review a completed trip

### Itinerary Routes (`/api/itinerary`)
- `POST /generate` - Generate new itinerary
- `GET /` - Get user itineraries
- `GET /:id` - Get specific itinerary

### Agent Routes (`/api/agent`)
- `POST /chat` - Chat with AI agent
- `POST /update` - Update itinerary via AI

### Map Routes (`/api/map`)
- `GET /geocode` - Convert address to coordinates
- `GET /reverse-geocode` - Convert coordinates to address
- `GET /search` - Search for places
- `GET /distance` - Calculate distance between points
- `GET /config` - Get map configuration
- `GET /hotels` - Search hotels by city using Amadeus API
- `GET /hotel-offers` - Get hotel offers and pricing
- `POST /multi-destination-route` - Plan optimal route for multiple destinations
- `POST /geocode-multiple` - Geocode multiple locations at once
- `POST /multi-destination-hotels` - Get hotels for multiple destinations

## Environment Variables

See `.env` file for required environment variables including API keys for various services.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
