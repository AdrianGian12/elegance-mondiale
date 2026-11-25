const axios = require('axios');

// Supported currencies configuration with symbols and decimal rules
const CURRENCY_CONFIG = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, locale: 'en-US', position: 'prefix' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, locale: 'de-DE', position: 'suffix' },
  BRL: { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', decimals: 2, locale: 'pt-BR', position: 'prefix' },
  PEN: { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', decimals: 2, locale: 'es-PE', position: 'prefix' },
  MXN: { code: 'MXN', name: 'Peso Mexicano', symbol: 'MX$', decimals: 2, locale: 'es-MX', position: 'prefix' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, locale: 'en-GB', position: 'prefix' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2, locale: 'en-CA', position: 'prefix' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2, locale: 'en-AU', position: 'prefix' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, locale: 'ja-JP', position: 'prefix' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2, locale: 'de-CH', position: 'prefix' },
  COP: { code: 'COP', name: 'Peso Colombiano', symbol: 'COL$', decimals: 0, locale: 'es-CO', position: 'prefix' },
  CLP: { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$', decimals: 0, locale: 'es-CL', position: 'prefix' },
  ARS: { code: 'ARS', name: 'Peso Argentino', symbol: 'AR$', decimals: 2, locale: 'es-AR', position: 'prefix' }
};

// Map ISO 3166-1 alpha-2 country codes to primary currencies
const COUNTRY_TO_CURRENCY = {
  US: 'USD',
  BR: 'BRL',
  PE: 'PEN',
  MX: 'MXN',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
  CH: 'CHF',
  CO: 'COP',
  CL: 'CLP',
  AR: 'ARS',
  // Eurozone countries
  ES: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', CY: 'EUR',
  MT: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', HR: 'EUR'
};

class CurrencyService {
  constructor() {
    this.baseCurrency = 'USD';
    this.rates = {
      USD: 1.0,
      EUR: 0.95,
      BRL: 5.75,
      PEN: 3.75,
      MXN: 20.30,
      GBP: 0.81,
      CAD: 1.41,
      AUD: 1.55,
      JPY: 153.5,
      CHF: 0.88,
      COP: 4350.0,
      CLP: 970.0,
      ARS: 1020.0
    };
    this.lastUpdated = new Date().toISOString();
    this.lastFetchedAt = 0;
    this.fetchIntervalMs = 60 * 60 * 1000; // 1 hour cache
  }

  getCurrencyForCountry(countryCode) {
    if (!countryCode) return 'USD';
    const code = countryCode.toUpperCase();
    return COUNTRY_TO_CURRENCY[code] || 'USD';
  }

  getCurrencyInfo(currencyCode) {
    const code = (currencyCode || 'USD').toUpperCase();
    return CURRENCY_CONFIG[code] || {
      code,
      name: code,
      symbol: code,
      decimals: 2,
      locale: 'en-US',
      position: 'prefix'
    };
  }

  getAllCurrencies() {
    return Object.keys(CURRENCY_CONFIG).map(code => ({
      ...CURRENCY_CONFIG[code],
      rate: this.rates[code] || 1.0
    }));
  }

  async refreshRates(apiKey = null) {
    const now = Date.now();
    // Use cached rates if fetched within the last hour unless explicitly forced
    if (now - this.lastFetchedAt < this.fetchIntervalMs && Object.keys(this.rates).length > 5) {
      return {
        rates: this.rates,
        lastUpdated: this.lastUpdated,
        fromCache: true
      };
    }

    try {
      let fetchedRates = null;

      // 1. If user supplied an ExchangeRate-API key in settings
      if (apiKey && apiKey.trim().length > 0) {
        try {
          const resp = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey.trim()}/latest/USD`, { timeout: 6000 });
          if (resp.data && resp.data.result === 'success') {
            fetchedRates = resp.data.conversion_rates;
          }
        } catch (err) {
          console.warn('[CurrencyService] Custom API key request failed, falling back to public endpoint:', err.message);
        }
      }

      // 2. Try open.er-api.com (open exchange rates, high reliability, real-time)
      if (!fetchedRates) {
        try {
          const resp = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 6000 });
          if (resp.data && resp.data.rates) {
            fetchedRates = resp.data.rates;
          }
        } catch (err) {
          console.warn('[CurrencyService] open.er-api failed, falling back to frankfurter:', err.message);
        }
      }

      // 3. Fallback to Frankfurter API
      if (!fetchedRates) {
        try {
          const resp = await axios.get('https://api.frankfurter.app/latest?from=USD', { timeout: 6000 });
          if (resp.data && resp.data.rates) {
            fetchedRates = { ...resp.data.rates, USD: 1.0 };
          }
        } catch (err) {
          console.warn('[CurrencyService] Frankfurter fallback also failed:', err.message);
        }
      }

      if (fetchedRates) {
        // Merge fetched rates into this.rates for supported currencies
        Object.keys(CURRENCY_CONFIG).forEach(code => {
          if (fetchedRates[code]) {
            this.rates[code] = parseFloat(fetchedRates[code]);
          }
        });
        this.rates['USD'] = 1.0;
        this.lastUpdated = new Date().toISOString();
        this.lastFetchedAt = now;
        console.log(`[CurrencyService] Exchange rates updated successfully. EUR: ${this.rates.EUR}, BRL: ${this.rates.BRL}, PEN: ${this.rates.PEN}`);
      }
    } catch (error) {
      console.error('[CurrencyService] Error refreshing exchange rates:', error.message);
    }

    return {
      rates: this.rates,
      lastUpdated: this.lastUpdated,
      fromCache: false
    };
  }

  convert(amountUsd, targetCurrency = 'USD') {
    const target = (targetCurrency || 'USD').toUpperCase();
    const rate = this.rates[target] || 1.0;
    const rawConverted = Number(amountUsd) * rate;
    const config = this.getCurrencyInfo(target);
    
    // Round according to currency decimal rules
    const rounded = Number(rawConverted.toFixed(config.decimals));

    // Proper formatting according to locale
    let formatted;
    try {
      formatted = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: target,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
      }).format(rounded);
    } catch (e) {
      formatted = config.position === 'prefix'
        ? `${config.symbol} ${rounded.toFixed(config.decimals)}`
        : `${rounded.toFixed(config.decimals)} ${config.symbol}`;
    }

    return {
      originalAmountUsd: Number(amountUsd),
      targetCurrency: target,
      exchangeRate: rate,
      convertedAmount: rounded,
      formatted,
      symbol: config.symbol,
      decimals: config.decimals,
      lastUpdated: this.lastUpdated
    };
  }
}

module.exports = new CurrencyService();
