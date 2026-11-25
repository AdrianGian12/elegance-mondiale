const axios = require('axios');
const currencyService = require('./currencyService');

class DhlService {
  constructor() {
    this.sandboxBaseUrl = 'https://express.api.dhl.com/mydhlapi/test';
    this.prodBaseUrl = 'https://express.api.dhl.com/mydhlapi';
  }

  /**
   * Consolidate items into realistic package weights and dimensions (metric: kg, cm)
   */
  calculatePackageMetrics(cartItems) {
    let totalWeightKg = 0;
    let totalPieces = 0;

    cartItems.forEach(item => {
      const qty = parseInt(item.quantity || 1, 10);
      const weight = parseFloat(item.weight_kg || 0.45); // Standard garment default ~450g
      totalWeightKg += weight * qty;
      totalPieces += qty;
    });

    // Ensure minimum weight of 0.2 kg
    totalWeightKg = Math.max(0.2, parseFloat(totalWeightKg.toFixed(2)));

    // Realistic consolidated apparel box dimensions
    let dimensions;
    if (totalWeightKg <= 1.0) {
      dimensions = { length: 32, width: 24, height: 8 }; // Small garment box
    } else if (totalWeightKg <= 3.0) {
      dimensions = { length: 40, width: 30, height: 14 }; // Medium garment box
    } else if (totalWeightKg <= 6.0) {
      dimensions = { length: 48, width: 36, height: 22 }; // Large apparel box
    } else {
      dimensions = { length: 58, width: 44, height: 32 }; // Extra-large master carton
    }

    return {
      totalWeightKg,
      totalPieces,
      dimensions,
      package: {
        typeCode: '3BX', // DHL Express standard box
        weight: totalWeightKg,
        dimensions
      }
    };
  }

  /**
   * Formats the planned shipping date for DHL (next business day, 10:00 AM UTC)
   */
  getPlannedShippingDate() {
    const date = new Date();
    // Add 1 day
    date.setDate(date.getDate() + 1);
    // If Sunday, push to Monday
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    // If Saturday, push to Monday
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T10:00:00GMT+00:00`;
  }

  /**
   * Request live shipping rates directly from official MyDHL API
   */
  async getRates({
    credentials,
    origin,
    destination,
    cartItems,
    declaredValueUsd,
    targetCurrency = 'USD'
  }) {
    // 1. Verify credentials presence
    if (!credentials || !credentials.apiKey || !credentials.apiSecret) {
      return {
        success: false,
        errorType: 'CREDENTIALS_MISSING',
        message: 'Credenciales de DHL Express no configuradas en el servidor.',
        details: 'Para obtener cotizaciones oficiales en tiempo real, ingresa tu DHL API Key y API Secret en el Panel de Administración (Configuración DHL).'
      };
    }

    const { apiKey, apiSecret, accountNumber, isSandbox = true } = credentials;
    const baseUrl = isSandbox ? this.sandboxBaseUrl : this.prodBaseUrl;
    const endpoint = `${baseUrl}/rates`;

    // 2. Validate destination
    if (!destination || !destination.countryCode) {
      return {
        success: false,
        errorType: 'INVALID_DESTINATION',
        message: 'El país de destino es obligatorio para calcular el envío con DHL.'
      };
    }

    const packageMetrics = this.calculatePackageMetrics(cartItems);
    const plannedDate = this.getPlannedShippingDate();

    // 3. Build official MyDHL API request payload
    const requestPayload = {
      customerDetails: {
        shipperDetails: {
          postalCode: origin.postalCode || '10001',
          cityName: origin.city || 'New York',
          countryCode: origin.countryCode || 'US',
          addressLine1: origin.address || '450 Fashion Avenue'
        },
        receiverDetails: {
          postalCode: destination.postalCode || '',
          cityName: destination.city || '',
          countryCode: destination.countryCode.toUpperCase(),
          addressLine1: destination.address || 'Calle Principal 123'
        }
      },
      plannedShippingDateAndTime: plannedDate,
      unitOfMeasurement: 'metric',
      isCustomsDeclarable: destination.countryCode.toUpperCase() !== (origin.countryCode || 'US').toUpperCase(),
      monetaryAmount: [
        {
          typeCode: 'declaredValue',
          value: parseFloat(declaredValueUsd || 100).toFixed(2),
          currency: 'USD'
        }
      ],
      packages: [packageMetrics.package]
    };

    if (accountNumber && accountNumber.trim().length > 0) {
      requestPayload.accounts = [
        {
          typeCode: 'shipper',
          number: accountNumber.trim()
        }
      ];
    }

    // 4. Authenticate via HTTP Basic Auth
    const authHeader = 'Basic ' + Buffer.from(`${apiKey.trim()}:${apiSecret.trim()}`).toString('base64');
    const messageRef = 'ROPA-' + Date.now();

    try {
      console.log(`[DhlService] Requesting MyDHL API rates from ${origin.countryCode} to ${destination.countryCode} (${endpoint})...`);
      const response = await axios.post(endpoint, requestPayload, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Message-Reference': messageRef,
          'Message-Reference-Date': new Date().toUTCString()
        },
        timeout: 12000
      });

      // 5. Parse MyDHL API Response
      if (response.data && Array.isArray(response.data.products) && response.data.products.length > 0) {
        const availableServices = response.data.products.map(prod => {
          // Find total price
          let priceAmount = 0;
          let priceCurrency = 'USD';

          if (Array.isArray(prod.totalPrice) && prod.totalPrice.length > 0) {
            priceAmount = parseFloat(prod.totalPrice[0].price);
            priceCurrency = prod.totalPrice[0].priceCurrency || 'USD';
          }

          // If price is in another currency, convert to USD first if needed, then to targetCurrency
          let priceInUsd = priceAmount;
          if (priceCurrency !== 'USD') {
            const curInfo = currencyService.rates[priceCurrency];
            if (curInfo && curInfo > 0) {
              priceInUsd = priceAmount / curInfo;
            }
          }

          // Convert to customer's target local currency
          const converted = currencyService.convert(priceInUsd, targetCurrency);

          // Delivery date estimation
          let estimatedDeliveryFormatted = 'Estimado 2-4 días hábiles';
          let deliveryDateRaw = null;
          if (prod.deliveryCapabilities && prod.deliveryCapabilities.estimatedDeliveryDateAndTime) {
            deliveryDateRaw = prod.deliveryCapabilities.estimatedDeliveryDateAndTime;
            try {
              const d = new Date(deliveryDateRaw);
              estimatedDeliveryFormatted = d.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            } catch (e) {
              estimatedDeliveryFormatted = deliveryDateRaw;
            }
          }

          return {
            serviceCode: prod.productCode || prod.localProductCode || 'EXPRESS',
            serviceName: prod.productName || 'DHL Express Worldwide',
            basePriceUsd: parseFloat(priceInUsd.toFixed(2)),
            quotedCurrency: priceCurrency,
            quotedPrice: priceAmount,
            targetCurrency: converted.targetCurrency,
            convertedPrice: converted.convertedAmount,
            formattedPrice: converted.formatted,
            estimatedDeliveryDate: deliveryDateRaw,
            estimatedDeliveryFormatted,
            totalTransitDays: prod.deliveryCapabilities ? prod.deliveryCapabilities.totalTransitDays : null
          };
        });

        return {
          success: true,
          destination: destination,
          packageMetrics,
          services: availableServices,
          source: 'DHL_EXPRESS_OFFICIAL_API',
          isSandbox
        };
      } else {
        return {
          success: false,
          errorType: 'NO_DHL_SERVICES_AVAILABLE',
          message: `DHL Express no tiene servicios de entrega disponibles para el destino ${destination.countryCode} (${destination.city || ''} ${destination.postalCode || ''}).`,
          destination
        };
      }
    } catch (apiError) {
      console.error('[DhlService] MyDHL API HTTP error:', apiError.response ? apiError.response.status : apiError.message);

      let errorMessage = 'No se pudo cotizar el envío con DHL Express.';
      let errorDetails = apiError.message;
      let statusCode = 500;

      if (apiError.response) {
        statusCode = apiError.response.status;
        const data = apiError.response.data;

        if (statusCode === 401 || statusCode === 403) {
          errorMessage = 'Credenciales de autenticación MyDHL API inválidas o no autorizadas.';
          errorDetails = 'Verifica que tu API Key y Secret sean correctos para el entorno seleccionado (Sandbox vs Producción).';
        } else if (statusCode === 400 || statusCode === 422) {
          if (data && data.detail) {
            errorMessage = `DHL Express error: ${data.detail}`;
          } else if (data && data.message) {
            errorMessage = `DHL Express error: ${data.message}`;
          } else if (data && data.additionalDetails) {
            errorMessage = `DHL Express: ${JSON.stringify(data.additionalDetails)}`;
          } else {
            errorMessage = 'Datos de destino o código postal rechazados por la API de DHL Express.';
          }
          errorDetails = JSON.stringify(data);
        } else if (statusCode === 404) {
          errorMessage = `Ruta no cubierta por DHL Express entre ${origin.countryCode} y ${destination.countryCode}.`;
        }
      }

      return {
        success: false,
        statusCode,
        errorType: 'DHL_API_ERROR',
        message: errorMessage,
        details: errorDetails,
        payloadSent: {
          origin: origin.countryCode,
          destination: destination.countryCode,
          postalCode: destination.postalCode,
          weightKg: packageMetrics.totalWeightKg
        }
      };
    }
  }
}

module.exports = new DhlService();
