const asyncHandler = require('express-async-handler');
const currencyService = require('../services/currencyService');
const User = require('../models/User');

// @desc    Get supported currencies
// @route   GET /api/currency/supported
// @access  Public
const getSupportedCurrencies = asyncHandler(async (req, res) => {
  const currencies = await currencyService.getSupportedCurrencies();
  
  res.json({
    success: true,
    data: currencies,
    count: currencies.length
  });
});

// @desc    Convert currency
// @route   GET /api/currency/convert
// @access  Public
const convertCurrency = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.query;
  
  if (!amount || !from || !to) {
    res.status(400);
    throw new Error('Amount, from currency, and to currency are required');
  }

  const convertedAmount = await currencyService.convertCurrency(
    parseFloat(amount),
    from.toUpperCase(),
    to.toUpperCase()
  );
  
  res.json({
    success: true,
    data: {
      originalAmount: parseFloat(amount),
      convertedAmount,
      fromCurrency: from.toUpperCase(),
      toCurrency: to.toUpperCase()
    }
  });
});

// @desc    Get exchange rate
// @route   GET /api/currency/rate
// @access  Public
const getExchangeRate = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
    res.status(400);
    throw new Error('From currency and to currency are required');
  }

  const rate = await currencyService.getExchangeRate(
    from.toUpperCase(),
    to.toUpperCase()
  );
  
  res.json({
    success: true,
    data: {
      fromCurrency: from.toUpperCase(),
      toCurrency: to.toUpperCase(),
      exchangeRate: rate
    }
  });
});

// @desc    Update user preferred currency
// @route   PUT /api/currency/preference
// @access  Private
const updateUserCurrency = asyncHandler(async (req, res) => {
  const { currency } = req.body;
  
  if (!currency) {
    res.status(400);
    throw new Error('Currency is required');
  }

  // Validate currency by checking if it's supported
  const supportedCurrencies = await currencyService.getSupportedCurrencies();
  if (!supportedCurrencies.includes(currency.toUpperCase())) {
    res.status(400);
    throw new Error('Unsupported currency');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.preferences.currency = currency.toUpperCase();
  await user.save();

  res.json({
    success: true,
    message: 'Currency preference updated successfully',
    data: {
      currency: user.preferences.currency
    }
  });
});

// @desc    Test currency conversion with mock hotel data
// @route   GET /api/currency/test-conversion
// @access  Public
const testCurrencyConversion = asyncHandler(async (req, res) => {
  const { targetCurrency = 'EUR' } = req.query;
  
  // Mock hotel data in USD
  const mockHotelData = [
    {
      hotelId: 'TEST001',
      name: 'Test Hotel Paris',
      offers: [
        {
          id: 'offer1',
          checkInDate: '2024-02-15',
          checkOutDate: '2024-02-17',
          roomType: 'STANDARD',
          price: {
            total: '250.00',
            currency: 'USD',
            base: '230.00'
          }
        },
        {
          id: 'offer2',
          checkInDate: '2024-02-15',
          checkOutDate: '2024-02-17',
          roomType: 'DELUXE',
          price: {
            total: '350.00',
            currency: 'USD',
            base: '320.00'
          }
        }
      ]
    },
    {
      hotelId: 'TEST002',
      name: 'Test Hotel London',
      offers: [
        {
          id: 'offer3',
          checkInDate: '2024-02-15',
          checkOutDate: '2024-02-17',
          roomType: 'SUITE',
          price: {
            total: '500.00',
            currency: 'USD',
            base: '460.00'
          }
        }
      ]
    }
  ];

  try {
    // Convert prices if target currency is not USD
    const convertedHotels = await Promise.all(mockHotelData.map(async (hotel) => {
      const convertedOffers = await Promise.all(hotel.offers.map(async (offer) => {
        let convertedPrice = { ...offer.price };
        
        if (targetCurrency !== 'USD') {
          try {
            convertedPrice.total = await currencyService.convertCurrency(
              parseFloat(offer.price.total), 
              'USD', 
              targetCurrency
            );
            convertedPrice.base = await currencyService.convertCurrency(
              parseFloat(offer.price.base), 
              'USD', 
              targetCurrency
            );
            convertedPrice.currency = targetCurrency;
          } catch (error) {
            console.warn(`Currency conversion failed for hotel ${hotel.hotelId}:`, error.message);
            // Keep original pricing if conversion fails
          }
        }

        return {
          ...offer,
          price: convertedPrice,
          originalPrice: offer.price
        };
      }));

      return {
        ...hotel,
        offers: convertedOffers
      };
    }));

    res.json({
      success: true,
      message: 'Currency conversion test completed',
      data: convertedHotels,
      testParams: {
        targetCurrency,
        originalCurrency: 'USD'
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Currency conversion test failed: ${error.message}`);
  }
});

module.exports = {
  getSupportedCurrencies,
  convertCurrency,
  getExchangeRate,
  updateUserCurrency,
  testCurrencyConversion
};
