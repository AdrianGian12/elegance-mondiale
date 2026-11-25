const axios = require('axios');
const currencyService = require('./currencyService');

// Comprehensive list of supported countries for international shipping & store display
const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', postalRegex: '^\\d{5}(-\\d{4})?$', defaultCity: 'New York', defaultPostal: '10001' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', flag: '🇧🇷', postalRegex: '^\\d{5}-?\\d{3}$', defaultCity: 'São Paulo', defaultPostal: '01310-100' },
  { code: 'PE', name: 'Perú', currency: 'PEN', flag: '🇵🇪', postalRegex: '^\\d{5}$', defaultCity: 'Lima', defaultPostal: '15074' },
  { code: 'MX', name: 'México', currency: 'MXN', flag: '🇲🇽', postalRegex: '^\\d{5}$', defaultCity: 'Ciudad de México', defaultPostal: '06600' },
  { code: 'ES', name: 'España', currency: 'EUR', flag: '🇪🇸', postalRegex: '^\\d{5}$', defaultCity: 'Madrid', defaultPostal: '28001' },
  { code: 'DE', name: 'Alemania (Germany)', currency: 'EUR', flag: '🇩🇪', postalRegex: '^\\d{5}$', defaultCity: 'Berlin', defaultPostal: '10115' },
  { code: 'FR', name: 'Francia (France)', currency: 'EUR', flag: '🇫🇷', postalRegex: '^\\d{5}$', defaultCity: 'Paris', defaultPostal: '75001' },
  { code: 'IT', name: 'Italia (Italy)', currency: 'EUR', flag: '🇮🇹', postalRegex: '^\\d{5}$', defaultCity: 'Milano', defaultPostal: '20121' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', postalRegex: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$', defaultCity: 'London', defaultPostal: 'SW1A 1AA' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', postalRegex: '^[A-Z]\\d[A-Z] ?\\d[A-Z]\\d$', defaultCity: 'Toronto', defaultPostal: 'M5V 2T6' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', postalRegex: '^\\d{4}$', defaultCity: 'Sydney', defaultPostal: '2000' },
  { code: 'JP', name: 'Japón (Japan)', currency: 'JPY', flag: '🇯🇵', postalRegex: '^\\d{3}-?\\d{4}$', defaultCity: 'Tokyo', defaultPostal: '100-0001' },
  { code: 'CH', name: 'Suiza (Switzerland)', currency: 'CHF', flag: '🇨🇭', postalRegex: '^\\d{4}$', defaultCity: 'Zurich', defaultPostal: '8001' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴', postalRegex: '^\\d{6}$', defaultCity: 'Bogotá', defaultPostal: '110111' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱', postalRegex: '^\\d{7}$', defaultCity: 'Santiago', defaultPostal: '8320000' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', flag: '🇦🇷', postalRegex: '^[A-Z]?\\d{4}[A-Z]{0,3}$', defaultCity: 'Buenos Aires', defaultPostal: 'C1002' }
];

const COUNTRY_MAP = {};
SUPPORTED_COUNTRIES.forEach(c => {
  COUNTRY_MAP[c.code] = c;
});

class GeolocationService {
  constructor() {
    this.cache = new Map();
  }

  isPrivateOrLocalIp(ip) {
    if (!ip) return true;
    const cleanIp = ip.replace(/^.*:/, ''); // Strip IPv6 prefix if mapped IPv4
    return (
      cleanIp === '127.0.0.1' ||
      cleanIp === 'localhost' ||
      cleanIp === '::1' ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('10.') ||
      (cleanIp.startsWith('172.') && parseInt(cleanIp.split('.')[1], 10) >= 16 && parseInt(cleanIp.split('.')[1], 10) <= 31)
    );
  }

  extractClientIp(req) {
    // Check custom override header (useful for testing different locations like Brazil or Peru)
    if (req.headers['x-override-country-ip']) {
      return req.headers['x-override-country-ip'];
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const parts = forwarded.split(',').map(s => s.trim());
      if (parts[0]) return parts[0];
    }

    if (req.headers['cf-connecting-ip']) {
      return req.headers['cf-connecting-ip'];
    }

    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'];
    }

    return req.socket ? req.socket.remoteAddress : '127.0.0.1';
  }

  async detectLocation(req) {
    const rawIp = this.extractClientIp(req);
    const isLocal = this.isPrivateOrLocalIp(rawIp);

    // If request contains an explicit simulated IP or Country from query (e.g. ?simulateCountry=BR)
    const simulateCountry = req.query && req.query.simulateCountry ? req.query.simulateCountry.toUpperCase() : null;
    if (simulateCountry && COUNTRY_MAP[simulateCountry]) {
      const countryData = COUNTRY_MAP[simulateCountry];
      const currency = currencyService.getCurrencyInfo(countryData.currency);
      return {
        countryCode: countryData.code,
        countryName: countryData.name,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        currencyName: currency.name,
        city: countryData.defaultCity,
        postalCode: countryData.defaultPostal,
        flag: countryData.flag,
        ip: rawIp,
        isSimulated: true,
        isLocal: false
      };
    }

    // If local development environment and not simulating
    if (isLocal) {
      // Default to US (or let's attempt to resolve actual public IP of the developer's router once)
      try {
        const publicIpResp = await axios.get('https://api.ipify.org?format=json', { timeout: 2500 });
        if (publicIpResp.data && publicIpResp.data.ip && !this.isPrivateOrLocalIp(publicIpResp.data.ip)) {
          return await this.lookupIp(publicIpResp.data.ip, true);
        }
      } catch (err) {
        // Fallback gracefully
      }

      const defaultCountry = COUNTRY_MAP['US'];
      const currency = currencyService.getCurrencyInfo(defaultCountry.currency);
      return {
        countryCode: defaultCountry.code,
        countryName: defaultCountry.name,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
        currencyName: currency.name,
        city: defaultCountry.defaultCity,
        postalCode: defaultCountry.defaultPostal,
        flag: defaultCountry.flag,
        ip: rawIp,
        isLocal: true,
        note: 'Entorno de desarrollo local detectado. Puedes cambiar de país libremente con el selector.'
      };
    }

    return await this.lookupIp(rawIp, false);
  }

  async lookupIp(ip, wasLocal = false) {
    if (this.cache.has(ip)) {
      return this.cache.get(ip);
    }

    try {
      // Query reputable IP geolocation service
      const resp = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,zip,query`, {
        timeout: 4000
      });

      if (resp.data && resp.data.status === 'success') {
        const countryCode = resp.data.countryCode ? resp.data.countryCode.toUpperCase() : 'US';
        const countryMeta = COUNTRY_MAP[countryCode] || {
          code: countryCode,
          name: resp.data.country || countryCode,
          currency: currencyService.getCurrencyForCountry(countryCode),
          flag: '🌐',
          defaultCity: resp.data.city || '',
          defaultPostal: resp.data.zip || ''
        };

        const currencyCode = currencyService.getCurrencyForCountry(countryCode);
        const currency = currencyService.getCurrencyInfo(currencyCode);

        const result = {
          countryCode: countryMeta.code,
          countryName: countryMeta.name,
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          currencyName: currency.name,
          city: resp.data.city || countryMeta.defaultCity,
          postalCode: resp.data.zip || countryMeta.defaultPostal,
          flag: countryMeta.flag,
          ip: ip,
          isLocal: wasLocal
        };

        this.cache.set(ip, result);
        return result;
      }
    } catch (error) {
      console.warn(`[GeolocationService] Failed to geolocate IP ${ip}:`, error.message);
    }

    // Fallback if IP lookup fails
    const fallback = COUNTRY_MAP['US'];
    const currency = currencyService.getCurrencyInfo('USD');
    return {
      countryCode: fallback.code,
      countryName: fallback.name,
      currencyCode: currency.code,
      currencySymbol: currency.symbol,
      currencyName: currency.name,
      city: fallback.defaultCity,
      postalCode: fallback.defaultPostal,
      flag: fallback.flag,
      ip: ip,
      isLocal: wasLocal,
      fallback: true
    };
  }

  getSupportedCountries() {
    return SUPPORTED_COUNTRIES.map(c => {
      const cur = currencyService.getCurrencyInfo(c.currency);
      return {
        ...c,
        currencySymbol: cur.symbol,
        currencyName: cur.name
      };
    });
  }

  getCountryDetails(countryCode) {
    const code = (countryCode || 'US').toUpperCase();
    const c = COUNTRY_MAP[code] || {
      code,
      name: code,
      currency: currencyService.getCurrencyForCountry(code),
      flag: '🌐',
      defaultCity: '',
      defaultPostal: ''
    };
    const cur = currencyService.getCurrencyInfo(c.currency);
    return {
      ...c,
      currencySymbol: cur.symbol,
      currencyName: cur.name
    };
  }
}

module.exports = new GeolocationService();
