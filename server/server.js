const express = require('express');
const cors = require('cors');

// Load environment variables first
require('./config/env');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

console.log('Starting TripzyAI server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 5000);

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/itinerary', require('./routes/itineraryRoutes'));
app.use('/api/agent', require('./routes/agentRoutes'));
app.use('/api/map', require('./routes/mapRoutes'));
app.use('/api/currency', require('./routes/currencyRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'TripzyAI Backend API' });
});

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
