import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currentCountry, setCurrentCountry] = useState({
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultCity: 'New York',
    defaultPostal: '10001'
  });

  const [currentCurrency, setCurrentCurrency] = useState({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    rate: 1.0
  });

  const [exchangeRates, setExchangeRates] = useState({ USD: 1.0 });
  const [supportedCountries, setSupportedCountries] = useState([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Initialize: Load countries, currencies, and detect location
  useEffect(() => {
    async function initLocationAndRates() {
      try {
        setIsLoading(true);

        // Fetch supported countries & currencies in parallel
        const [countriesRes, currenciesRes] = await Promise.all([
          api.getCountries(),
          api.getCurrencies()
        ]);

        if (countriesRes.success) setSupportedCountries(countriesRes.countries);
        if (currenciesRes.success) {
          setSupportedCurrencies(currenciesRes.currencies);
          setLastUpdated(currenciesRes.lastUpdated);

          const rateMap = {};
          currenciesRes.currencies.forEach(c => {
            rateMap[c.code] = c.rate;
          });
          setExchangeRates(rateMap);
        }

        // Check if user has previously saved preferences
        const savedCountryCode = localStorage.getItem('elegance_user_country');
        const savedCurrencyCode = localStorage.getItem('elegance_user_currency');

        if (savedCountryCode && savedCurrencyCode) {
          setIsManualOverride(true);
          const foundCountry = countriesRes.countries?.find(c => c.code === savedCountryCode);
          const foundCurrency = currenciesRes.currencies?.find(c => c.code === savedCurrencyCode);

          if (foundCountry) setCurrentCountry(foundCountry);
          if (foundCurrency) setCurrentCurrency(foundCurrency);
        } else {
          // Automatic IP Geolocation detection
          const locRes = await api.getLocation();
          if (locRes.success && locRes.location) {
            const country = countriesRes.countries?.find(c => c.code === locRes.location.countryCode) || {
              code: locRes.location.countryCode,
              name: locRes.location.countryName,
              flag: locRes.location.flag || '🌐',
              defaultCity: locRes.location.city,
              defaultPostal: locRes.location.postalCode
            };
            setCurrentCountry(country);

            const currCode = locRes.currency.code;
            const currency = currenciesRes.currencies?.find(c => c.code === currCode) || {
              code: currCode,
              name: locRes.currency.name,
              symbol: locRes.currency.symbol,
              decimals: locRes.currency.decimals || 2,
              rate: locRes.currency.exchangeRate || 1.0
            };
            setCurrentCurrency(currency);
          }
        }
      } catch (err) {
        console.error('Error initializing location and currency:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initLocationAndRates();
  }, []);

  // Update country and currency manually (and persist in localStorage)
  const setCountryAndCurrency = (countryCode, currencyCode = null) => {
    const country = supportedCountries.find(c => c.code === countryCode);
    if (!country) return;

    const targetCurrCode = currencyCode || country.currency || 'USD';
    const currency = supportedCurrencies.find(c => c.code === targetCurrCode) || {
      code: targetCurrCode,
      name: targetCurrCode,
      symbol: '$',
      decimals: 2,
      rate: exchangeRates[targetCurrCode] || 1.0
    };

    setCurrentCountry(country);
    setCurrentCurrency(currency);
    setIsManualOverride(true);

    localStorage.setItem('elegance_user_country', country.code);
    localStorage.setItem('elegance_user_currency', currency.code);
  };

  // Reset to automatic geolocation
  const resetToAutomaticLocation = async () => {
    localStorage.removeItem('elegance_user_country');
    localStorage.removeItem('elegance_user_currency');
    setIsManualOverride(false);
    setIsLoading(true);

    try {
      const locRes = await api.getLocation();
      if (locRes.success && locRes.location) {
        const country = supportedCountries.find(c => c.code === locRes.location.countryCode) || {
          code: locRes.location.countryCode,
          name: locRes.location.countryName,
          flag: locRes.location.flag || '🌐',
          defaultCity: locRes.location.city,
          defaultPostal: locRes.location.postalCode
        };
        setCurrentCountry(country);

        const currency = supportedCurrencies.find(c => c.code === locRes.currency.code) || {
          code: locRes.currency.code,
          name: locRes.currency.name,
          symbol: locRes.currency.symbol,
          decimals: 2,
          rate: locRes.currency.exchangeRate || 1.0
        };
        setCurrentCurrency(currency);
      }
    } catch (e) {
      console.error('Error resetting to auto location:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert an amount in USD to the user's current currency
  const convertPrice = (amountUsd) => {
    const rate = exchangeRates[currentCurrency.code] || currentCurrency.rate || 1.0;
    const converted = Number(amountUsd) * rate;
    const decimals = currentCurrency.decimals !== undefined ? currentCurrency.decimals : 2;
    return Number(converted.toFixed(decimals));
  };

  // Format an amount in USD into formatted local currency string
  const formatPrice = (amountUsd) => {
    const converted = convertPrice(amountUsd);
    const decimals = currentCurrency.decimals !== undefined ? currentCurrency.decimals : 2;
    const locale = currentCurrency.locale || 'en-US';

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currentCurrency.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(converted);
    } catch (e) {
      return `${currentCurrency.symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: decimals })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      currentCountry,
      currentCurrency,
      exchangeRates,
      supportedCountries,
      supportedCurrencies,
      lastUpdated,
      isLoading,
      isManualOverride,
      isCurrencyModalOpen,
      setIsCurrencyModalOpen,
      setCountryAndCurrency,
      resetToAutomaticLocation,
      convertPrice,
      formatPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
