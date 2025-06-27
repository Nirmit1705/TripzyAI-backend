
const axios = require('axios');

class CurrencyService {
  constructor() {
    this.baseUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  // Get exchange rates for a specific currency
  async getExchangeRates(baseCurrency = 'usd') {
    const cacheKey = baseCurrency.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rates;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${cacheKey}.json`);
      const rates = response.data[cacheKey];
      
      this.cache.set(cacheKey, {
        rates,
        timestamp: Date.now()
      });
      
      return rates;
    } catch (error) {
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }

  // Convert amount from one currency to another
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
      return amount;
    }

    try {
      const rates = await this.getExchangeRates(fromCurrency.toLowerCase());
      const targetRate = rates[toCurrency.toLowerCase()];
      
      if (!targetRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      
      return Math.round(amount * targetRate * 100) / 100;
    } catch (error) {
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  // Convert multiple amounts at once
  async convertMultipleCurrencies(conversions, fromCurrency, toCurrency) {
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
      return conversions;
    }

    const rates = await this.getExchangeRates(fromCurrency.toLowerCase());
    const targetRate = rates[toCurrency.toLowerCase()];
    
    if (!targetRate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    return conversions.map(amount => Math.round(amount * targetRate * 100) / 100);
  }

  // Get list of supported currencies
  async getSupportedCurrencies() {
    try {
      const rates = await this.getExchangeRates('usd');
      return Object.keys(rates).map(currency => currency.toUpperCase());
    } catch (error) {
      throw new Error(`Failed to fetch supported currencies: ${error.message}`);
    }
  }

  // Get current exchange rate between two currencies
  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
      return 1;
    }

    const rates = await this.getExchangeRates(fromCurrency.toLowerCase());
    const targetRate = rates[toCurrency.toLowerCase()];
    
    if (!targetRate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return targetRate;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CurrencyService();
