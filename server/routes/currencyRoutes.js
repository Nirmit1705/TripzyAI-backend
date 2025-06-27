const express = require('express');
const {
  getSupportedCurrencies,
  convertCurrency,
  getExchangeRate,
  updateUserCurrency,
  testCurrencyConversion
} = require('../controllers/currencyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// @desc    Get supported currencies
// @route   GET /api/currency/supported
// @access  Public
router.get('/supported', getSupportedCurrencies);

// @desc    Convert currency
// @route   GET /api/currency/convert
// @access  Public
router.get('/convert', convertCurrency);

// @desc    Get exchange rate
// @route   GET /api/currency/rate
// @access  Public
router.get('/rate', getExchangeRate);

// @desc    Test currency conversion with mock data
// @route   GET /api/currency/test-conversion
// @access  Public
router.get('/test-conversion', testCurrencyConversion);

// @desc    Update user preferred currency
// @route   PUT /api/currency/preference
// @access  Private
router.put('/preference', protect, updateUserCurrency);

module.exports = router;
