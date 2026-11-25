const express = require('express');
const router = express.Router();
const db = require('../database');
const currencyService = require('../services/currencyService');
const geolocationService = require('../services/geolocationService');
const dhlService = require('../services/dhlService');

// Helper to get all settings as an object
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

// -------------------------------------------------------------
// 1. GEOLOCATION & CURRENCY ENDPOINTS
// -------------------------------------------------------------

// Auto-detect visitor location & local currency
router.get('/location', async (req, res) => {
  try {
    const location = await geolocationService.detectLocation(req);
    const settings = getSettings();
    
    // Refresh rates if needed
    await currencyService.refreshRates(settings.currency_api_key);

    const currencyInfo = currencyService.getCurrencyInfo(location.currencyCode);
    const exchangeRate = currencyService.rates[location.currencyCode] || 1.0;

    res.json({
      success: true,
      location,
      currency: {
        ...currencyInfo,
        exchangeRate,
        baseCurrency: currencyService.baseCurrency,
        lastUpdated: currencyService.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error in /api/location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all supported countries
router.get('/countries', (req, res) => {
  res.json({
    success: true,
    countries: geolocationService.getSupportedCountries()
  });
});

// List all supported currencies with current exchange rates
router.get('/currencies', async (req, res) => {
  try {
    const settings = getSettings();
    await currencyService.refreshRates(settings.currency_api_key);
    res.json({
      success: true,
      baseCurrency: currencyService.baseCurrency,
      lastUpdated: currencyService.lastUpdated,
      currencies: currencyService.getAllCurrencies()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Refresh exchange rates on demand
router.post('/currencies/refresh', async (req, res) => {
  try {
    const settings = getSettings();
    const result = await currencyService.refreshRates(settings.currency_api_key);
    res.json({
      success: true,
      ...result,
      currencies: currencyService.getAllCurrencies()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 2. PRODUCTS ENDPOINTS
// -------------------------------------------------------------

// Get products catalog with dynamic local currency conversion
router.get('/products', async (req, res) => {
  try {
    const { category, search, currency = 'USD' } = req.query;
    const targetCurrency = currency.toUpperCase();

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'Todos') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY featured DESC, id ASC';

    const products = db.prepare(query).all(...params);

    // Decorate each product with converted price while keeping base_price_usd untouched!
    const formattedProducts = products.map(p => {
      const converted = currencyService.convert(p.base_price_usd, targetCurrency);
      return {
        ...p,
        sizes: JSON.parse(p.sizes || '[]'),
        colors: JSON.parse(p.colors || '[]'),
        images: JSON.parse(p.images || '[]'),
        price: {
          baseUsd: p.base_price_usd,
          converted: converted.convertedAmount,
          currency: targetCurrency,
          formatted: converted.formatted,
          symbol: converted.symbol,
          rate: converted.exchangeRate
        }
      };
    });

    res.json({
      success: true,
      count: formattedProducts.length,
      targetCurrency,
      products: formattedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product
router.get('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { currency = 'USD' } = req.query;
    const targetCurrency = currency.toUpperCase();

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const converted = currencyService.convert(product.base_price_usd, targetCurrency);

    res.json({
      success: true,
      product: {
        ...product,
        sizes: JSON.parse(product.sizes || '[]'),
        colors: JSON.parse(product.colors || '[]'),
        images: JSON.parse(product.images || '[]'),
        price: {
          baseUsd: product.base_price_usd,
          converted: converted.convertedAmount,
          currency: targetCurrency,
          formatted: converted.formatted,
          symbol: converted.symbol,
          rate: converted.exchangeRate
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 3. DHL SHIPPING RATE QUOTATION
// -------------------------------------------------------------

router.post('/shipping/dhl-quote', async (req, res) => {
  try {
    const { destination, cartItems, targetCurrency = 'USD' } = req.body;

    if (!destination || !destination.countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Falta información de destino (código de país obligatorio).'
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito de compras está vacío.'
      });
    }

    const settings = getSettings();

    // Calculate declared value in USD for customs
    let declaredValueUsd = 0;
    cartItems.forEach(item => {
      declaredValueUsd += (item.price_usd || item.base_price_usd || 50) * (item.quantity || 1);
    });

    const origin = {
      countryCode: settings.origin_country_code || 'US',
      city: settings.origin_city || 'New York',
      postalCode: settings.origin_postal_code || '10001',
      address: settings.origin_address || '5th Avenue Fashion District, Suite 400'
    };

    const credentials = {
      apiKey: settings.dhl_api_key,
      apiSecret: settings.dhl_api_secret,
      accountNumber: settings.dhl_account_number,
      isSandbox: settings.dhl_is_sandbox === 'true'
    };

    const quoteResult = await dhlService.getRates({
      credentials,
      origin,
      destination,
      cartItems,
      declaredValueUsd,
      targetCurrency
    });

    res.json(quoteResult);
  } catch (error) {
    console.error('Error in /shipping/dhl-quote:', error);
    res.status(500).json({
      success: false,
      errorType: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// -------------------------------------------------------------
// 4. ORDERS & CHECKOUT
// -------------------------------------------------------------

router.post('/orders', (req, res) => {
  try {
    const {
      customer,
      destination,
      items,
      shippingOption,
      currency = 'USD'
    } = req.body;

    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({ success: false, message: 'Datos del cliente incompletos' });
    }

    if (!destination || !destination.countryCode || !destination.postalCode) {
      return res.status(400).json({ success: false, message: 'Dirección de destino y código postal requeridos' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay artículos en la orden' });
    }

    const targetCurrency = (currency || 'USD').toUpperCase();
    const rate = currencyService.rates[targetCurrency] || 1.0;

    // Calculate subtotal in base USD and package weight
    let subtotalUsd = 0;
    let totalWeightKg = 0;

    const validatedItems = items.map(item => {
      // Lookup actual product in database to guarantee real base price
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId || item.id);
      const priceUsd = product ? product.base_price_usd : (item.price_usd || 100);
      const qty = item.quantity || 1;
      const weight = product ? product.weight_kg : (item.weight_kg || 0.45);

      subtotalUsd += priceUsd * qty;
      totalWeightKg += weight * qty;

      return {
        id: product ? product.id : item.id,
        name: product ? product.name : item.name,
        size: item.selectedSize || item.size || 'M',
        color: item.selectedColor || item.color || 'Default',
        quantity: qty,
        price_usd: priceUsd,
        weight_kg: weight
      };
    });

    const shippingUsd = shippingOption ? parseFloat(shippingOption.basePriceUsd || 0) : 0;
    const totalUsd = subtotalUsd + shippingUsd;

    // Convert to local currency
    const subtotalLocal = parseFloat((subtotalUsd * rate).toFixed(2));
    const shippingLocal = parseFloat((shippingUsd * rate).toFixed(2));
    const totalLocal = parseFloat((totalUsd * rate).toFixed(2));

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${destination.countryCode}`;

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone,
        destination_country, destination_country_name, destination_city,
        postal_code, address_line1, items_json, total_weight_kg,
        subtotal_usd, shipping_usd, total_usd, currency_paid, exchange_rate_applied,
        subtotal_local, shipping_local, total_local, dhl_service_code, dhl_service_name,
        dhl_estimated_delivery, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertOrder.run(
      orderId,
      customer.name,
      customer.email,
      customer.phone || '',
      destination.countryCode,
      destination.countryName || destination.countryCode,
      destination.city || '',
      destination.postalCode,
      destination.address || '',
      JSON.stringify(validatedItems),
      parseFloat(totalWeightKg.toFixed(2)),
      subtotalUsd,
      shippingUsd,
      totalUsd,
      targetCurrency,
      rate,
      subtotalLocal,
      shippingLocal,
      totalLocal,
      shippingOption ? shippingOption.serviceCode : 'N/A',
      shippingOption ? shippingOption.serviceName : 'Envío no seleccionado',
      shippingOption ? shippingOption.estimatedDeliveryFormatted : '',
      'confirmed'
    );

    // Update stock counts
    const updateStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');
    validatedItems.forEach(it => {
      updateStock.run(it.quantity, it.id);
    });

    res.json({
      success: true,
      orderId,
      message: '¡Orden procesada con éxito!',
      order: {
        id: orderId,
        customer,
        destination,
        items: validatedItems,
        totalWeightKg,
        financials: {
          currency: targetCurrency,
          rate,
          subtotalLocal,
          shippingLocal,
          totalLocal,
          baseUsd: {
            subtotalUsd,
            shippingUsd,
            totalUsd
          }
        },
        shippingOption
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 5. ADMIN PANEL ENDPOINTS
// -------------------------------------------------------------

// Get admin orders & analytics
router.get('/admin/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();

    // Metrics calculation
    let totalRevenueUsd = 0;
    let totalShippingCollectedUsd = 0;
    const countryStats = {};

    orders.forEach(o => {
      totalRevenueUsd += o.total_usd;
      totalShippingCollectedUsd += o.shipping_usd;
      const c = o.destination_country;
      countryStats[c] = (countryStats[c] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalOrders: orders.length,
        totalRevenueUsd: parseFloat(totalRevenueUsd.toFixed(2)),
        totalShippingCollectedUsd: parseFloat(totalShippingCollectedUsd.toFixed(2)),
        countryBreakdown: countryStats
      },
      orders: orders.map(o => ({
        ...o,
        items: JSON.parse(o.items_json || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.patch('/admin/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: `Estado de la orden actualizado a ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Product CRUD
router.post('/admin/products', (req, res) => {
  try {
    const {
      name, description, category, base_price_usd, stock,
      weight_kg, length_cm, width_cm, height_cm, sizes, colors, images, featured
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO products (
        name, description, category, base_price_usd, stock,
        weight_kg, length_cm, width_cm, height_cm, sizes, colors, images, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name,
      description,
      category,
      parseFloat(base_price_usd),
      parseInt(stock || 10, 10),
      parseFloat(weight_kg || 0.5),
      parseFloat(length_cm || 30),
      parseFloat(width_cm || 20),
      parseFloat(height_cm || 5),
      typeof sizes === 'string' ? sizes : JSON.stringify(sizes || ['M']),
      typeof colors === 'string' ? colors : JSON.stringify(colors || []),
      typeof images === 'string' ? images : JSON.stringify(images || []),
      featured ? 1 : 0
    );

    res.json({ success: true, productId: info.lastInsertRowid, message: 'Producto registrado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, category, base_price_usd, stock,
      weight_kg, length_cm, width_cm, height_cm, sizes, colors, images, featured
    } = req.body;

    db.prepare(`
      UPDATE products SET
        name = ?, description = ?, category = ?, base_price_usd = ?, stock = ?,
        weight_kg = ?, length_cm = ?, width_cm = ?, height_cm = ?,
        sizes = ?, colors = ?, images = ?, featured = ?
      WHERE id = ?
    `).run(
      name,
      description,
      category,
      parseFloat(base_price_usd),
      parseInt(stock, 10),
      parseFloat(weight_kg),
      parseFloat(length_cm),
      parseFloat(width_cm),
      parseFloat(height_cm),
      typeof sizes === 'string' ? sizes : JSON.stringify(sizes),
      typeof colors === 'string' ? colors : JSON.stringify(colors),
      typeof images === 'string' ? images : JSON.stringify(images),
      featured ? 1 : 0,
      id
    );

    res.json({ success: true, message: 'Producto actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Settings
router.get('/admin/settings', (req, res) => {
  try {
    const settings = getSettings();
    // Mask sensitive secrets partially for display
    const masked = { ...settings };
    if (masked.dhl_api_secret && masked.dhl_api_secret.length > 4) {
      masked.dhl_api_secret_masked = masked.dhl_api_secret.slice(0, 4) + '••••••••';
    }
    res.json({ success: true, settings: masked });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/settings', (req, res) => {
  try {
    const newSettings = req.body;
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    
    const updateTx = db.transaction((entries) => {
      for (const [key, val] of Object.entries(entries)) {
        // Do not overwrite secret if masked placeholder sent
        if (key === 'dhl_api_secret' && val.includes('••••')) continue;
        if (key === 'dhl_api_secret_masked') continue;
        upsert.run(key, String(val));
      }
    });

    updateTx(newSettings);
    res.json({ success: true, message: 'Configuraciones de DHL y sistema guardadas correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
