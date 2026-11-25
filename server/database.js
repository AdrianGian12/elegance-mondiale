const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'store.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    base_price_usd REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 10,
    weight_kg REAL NOT NULL DEFAULT 0.5,
    length_cm REAL NOT NULL DEFAULT 35,
    width_cm REAL NOT NULL DEFAULT 25,
    height_cm REAL NOT NULL DEFAULT 5,
    sizes TEXT NOT NULL,
    colors TEXT NOT NULL,
    images TEXT NOT NULL,
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    destination_country TEXT NOT NULL,
    destination_country_name TEXT,
    destination_city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_weight_kg REAL NOT NULL,
    subtotal_usd REAL NOT NULL,
    shipping_usd REAL NOT NULL,
    total_usd REAL NOT NULL,
    currency_paid TEXT NOT NULL,
    exchange_rate_applied REAL NOT NULL,
    subtotal_local REAL NOT NULL,
    shipping_local REAL NOT NULL,
    total_local REAL NOT NULL,
    dhl_service_code TEXT,
    dhl_service_name TEXT,
    dhl_estimated_delivery TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default settings if empty
const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (checkSettings.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['dhl_api_key', ''],
    ['dhl_api_secret', ''],
    ['dhl_account_number', ''],
    ['dhl_is_sandbox', 'true'],
    ['origin_country_code', 'US'],
    ['origin_city', 'New York'],
    ['origin_postal_code', '10001'],
    ['origin_address', '5th Avenue Fashion District, Suite 400'],
    ['currency_api_key', ''],
    ['store_name', 'ÉLÉGANCE MONDIALE'],
    ['store_currency_base', 'USD']
  ];

  const insertMany = db.transaction((settingsList) => {
    for (const [k, v] of settingsList) {
      insertSetting.run(k, v);
    }
  });
  insertMany(defaultSettings);
  console.log('[Database] Default settings initialized.');
}

// Seed luxury fashion products if empty
const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (checkProducts.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, category, base_price_usd, stock, 
      weight_kg, length_cm, width_cm, height_cm, sizes, colors, images, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProducts = [
    {
      name: 'Abrigo Sastrería de Cachemira Pura',
      description: 'Confeccionado en Florencia con lana de cachemira virgen de doble faz. Solapas de muesca con caída drapeada impecable, forro interior de seda natural de 19 mommes y botones artesanales de cuerno pulido. Un tributo atemporal al lujo silencioso.',
      category: 'Abrigos y Chaquetas',
      base_price_usd: 1250.00,
      stock: 14,
      weight_kg: 1.45,
      length_cm: 45,
      width_cm: 35,
      height_cm: 10,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Camel Real', hex: '#c19a6b' },
        { name: 'Negro Azabache', hex: '#111827' },
        { name: 'Gris Marengo', hex: '#4b5563' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 1
    },
    {
      name: 'Vestido de Noche Asimétrico en Seda Mora',
      description: 'Vestido largo de fiesta esculpido en crepé de seda pura con corte al bies. Cuello asimétrico con detalle drapeado al hombro, espalda semicubierta y abertura lateral sutil. Diseñado para galas internacionales y eventos exclusivos.',
      category: 'Vestidos de Gala',
      base_price_usd: 890.00,
      stock: 9,
      weight_kg: 0.55,
      length_cm: 38,
      width_cm: 28,
      height_cm: 5,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      colors: JSON.stringify([
        { name: 'Verde Esmeralda', hex: '#064e3b' },
        { name: 'Borgoña Profundo', hex: '#4a0404' },
        { name: 'Negro Medianoche', hex: '#0f172a' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 1
    },
    {
      name: 'Chaqueta Blazer Cruzada Structured Wool',
      description: 'Blazer de doble botonadura estructurado con hombreras definidas inspiradas en la alta sastrería de Savile Row. Tejido en sarga de lana fría superfina 130s con solapa en pico satinada y forro transpirable de cupro.',
      category: 'Sastrería y Trajes',
      base_price_usd: 720.00,
      stock: 18,
      weight_kg: 0.95,
      length_cm: 42,
      width_cm: 32,
      height_cm: 7,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Blanco Marfil', hex: '#fdfbf7' },
        { name: 'Azul Marino Real', hex: '#0f172a' },
        { name: 'Gris Carbón', hex: '#1f2937' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 1
    },
    {
      name: 'Camisa Oversize de Seda Habotai Italiana',
      description: 'Prenda imprescindible confeccionada en seda natural brillante y etérea. Cuello amplio desestructurado, botones ocultos de nácar japonés y puños con corte francés de doble ajuste. Tacto inigualable sobre la piel.',
      category: 'Camisas y Blusas',
      base_price_usd: 440.00,
      stock: 22,
      weight_kg: 0.30,
      length_cm: 32,
      width_cm: 24,
      height_cm: 3,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      colors: JSON.stringify([
        { name: 'Champagne Perla', hex: '#fef3c7' },
        { name: 'Rosa Empolvado', hex: '#fbcfe8' },
        { name: 'Negro Mate', hex: '#18181b' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 0
    },
    {
      name: 'Pantalón Palazzo de Lana Virgen y Pinzas',
      description: 'Pantalón sastre de talle alto con doble pinza frontal y pernera fluida extra ancha. Cierre con pretina extendida y hebilla lateral metálica. Confeccionado en lana elástica termorreguladora de Biella.',
      category: 'Sastrería y Trajes',
      base_price_usd: 510.00,
      stock: 15,
      weight_kg: 0.65,
      length_cm: 36,
      width_cm: 26,
      height_cm: 4,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Beige Arena', hex: '#d6c5af' },
        { name: 'Negro Profundo', hex: '#09090b' },
        { name: 'Terracota Cálido', hex: '#9a3412' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 0
    },
    {
      name: 'Jersey Cuello Cisne de Lana Merino Extrafina',
      description: 'Punto fino galga 18 tejido con hilo 100% lana merino australiana con tratamiento antipilling. Cuello envolvente de alta densidad sin costuras visibles, puños y bajo acanalados.',
      category: 'Punto y Cachemira',
      base_price_usd: 380.00,
      stock: 25,
      weight_kg: 0.40,
      length_cm: 30,
      width_cm: 22,
      height_cm: 4,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Crema Crudo', hex: '#fdfbf7' },
        { name: 'Oliva Intenso', hex: '#3f6212' },
        { name: 'Azul Noche', hex: '#1e3a8a' },
        { name: 'Gris Antracita', hex: '#374151' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 0
    },
    {
      name: 'Gabardina Clásica Resistente al Agua Weatherproof',
      description: 'Gabardina impermeable de doble botonadura en algodón orgánico compactado con cinturón de hebilla forrada en cuero. Solapa de tormenta en espalda, charreteras en hombros e interior con forro jacquard exclusivo.',
      category: 'Abrigos y Chaquetas',
      base_price_usd: 960.00,
      stock: 11,
      weight_kg: 1.30,
      length_cm: 46,
      width_cm: 36,
      height_cm: 8,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Miel Tostado', hex: '#b48a52' },
        { name: 'Verde Militar', hex: '#2d3748' },
        { name: 'Negro Carbón', hex: '#18181b' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 1
    },
    {
      name: 'Falda Midi Plisada en Crepé Satinado',
      description: 'Plisado acordeón permanente con cintura elástica sutil enmarcada en grosgrain. Movimiento fluido hipnótico que se adapta con soltura tanto a botines de piel como a tacones de noche.',
      category: 'Faldas y Conjuntos',
      base_price_usd: 460.00,
      stock: 16,
      weight_kg: 0.42,
      length_cm: 34,
      width_cm: 25,
      height_cm: 3,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      colors: JSON.stringify([
        { name: 'Oro Viejo Metalizado', hex: '#d4af37' },
        { name: 'Negro Ónix', hex: '#09090b' },
        { name: 'Cobre Brillante', hex: '#b45309' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop'
      ]),
      featured: 0
    }
  ];

  const insertProductsTx = db.transaction((items) => {
    for (const p of items) {
      insertProduct.run(
        p.name, p.description, p.category, p.base_price_usd, p.stock,
        p.weight_kg, p.length_cm, p.width_cm, p.height_cm,
        p.sizes, p.colors, p.images, p.featured
      );
    }
  });

  insertProductsTx(initialProducts);
  console.log('[Database] Seeded 8 luxury fashion products.');
}

// Seed sample international orders if empty
const checkOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
if (checkOrders.count === 0) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_name, customer_email, customer_phone,
      destination_country, destination_country_name, destination_city,
      postal_code, address_line1, items_json, total_weight_kg,
      subtotal_usd, shipping_usd, total_usd, currency_paid, exchange_rate_applied,
      subtotal_local, shipping_local, total_local, dhl_service_code, dhl_service_name,
      dhl_estimated_delivery, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialOrders = [
    {
      id: 'ORD-2026-BR-891',
      customer_name: 'Camila Rodriguez da Silva',
      customer_email: 'camila.silva@uol.com.br',
      customer_phone: '+55 11 98765-4321',
      destination_country: 'BR',
      destination_country_name: 'Brasil',
      destination_city: 'São Paulo',
      postal_code: '01414-000',
      address_line1: 'Rua Oscar Freire 920, Jardins',
      items_json: JSON.stringify([
        { id: 1, name: 'Abrigo Sastrería de Cachemira Pura', size: 'M', color: 'Camel Real', quantity: 1, price_usd: 1250.00 }
      ]),
      total_weight_kg: 1.45,
      subtotal_usd: 1250.00,
      shipping_usd: 68.50,
      total_usd: 1318.50,
      currency_paid: 'BRL',
      exchange_rate_applied: 5.75,
      subtotal_local: 7187.50,
      shipping_local: 393.88,
      total_local: 7581.38,
      dhl_service_code: 'EXPRESS_WORLDWIDE',
      dhl_service_name: 'DHL Express Worldwide',
      dhl_estimated_delivery: '3 días hábiles',
      status: 'shipped',
      created_at: '2026-11-23 14:20:00'
    },
    {
      id: 'ORD-2026-PE-442',
      customer_name: 'Mateo De La Vega',
      customer_email: 'mateo.delavega@gmail.com',
      customer_phone: '+51 998 765 432',
      destination_country: 'PE',
      destination_country_name: 'Perú',
      destination_city: 'Lima',
      postal_code: '15074',
      address_line1: 'Malecón Cisneros 1140, Miraflores',
      items_json: JSON.stringify([
        { id: 2, name: 'Vestido de Noche Asimétrico en Seda Mora', size: 'S', color: 'Verde Esmeralda', quantity: 1, price_usd: 890.00 }
      ]),
      total_weight_kg: 0.55,
      subtotal_usd: 890.00,
      shipping_usd: 54.00,
      total_usd: 944.00,
      currency_paid: 'PEN',
      exchange_rate_applied: 3.75,
      subtotal_local: 3337.50,
      shipping_local: 202.50,
      total_local: 3540.00,
      dhl_service_code: 'EXPRESS_WORLDWIDE',
      dhl_service_name: 'DHL Express Worldwide',
      dhl_estimated_delivery: '2 días hábiles',
      status: 'processing',
      created_at: '2026-11-24 10:15:00'
    },
    {
      id: 'ORD-2026-ES-319',
      customer_name: 'Elena Montero Gil',
      customer_email: 'elena.montero@gmail.com',
      customer_phone: '+34 612 345 678',
      destination_country: 'ES',
      destination_country_name: 'España',
      destination_city: 'Madrid',
      postal_code: '28001',
      address_line1: 'Calle de Serrano 45, 3º D',
      items_json: JSON.stringify([
        { id: 3, name: 'Chaqueta Blazer Cruzada Structured Wool', size: 'M', color: 'Blanco Marfil', quantity: 1, price_usd: 720.00 },
        { id: 4, name: 'Camisa Oversize de Seda Habotai Italiana', size: 'M', color: 'Champagne Perla', quantity: 1, price_usd: 440.00 }
      ]),
      total_weight_kg: 1.25,
      subtotal_usd: 1160.00,
      shipping_usd: 62.00,
      total_usd: 1222.00,
      currency_paid: 'EUR',
      exchange_rate_applied: 0.95,
      subtotal_local: 1102.00,
      shipping_local: 58.90,
      total_local: 1160.90,
      dhl_service_code: 'EXPRESS_WORLDWIDE',
      dhl_service_name: 'DHL Express Worldwide',
      dhl_estimated_delivery: '3 días hábiles',
      status: 'confirmed',
      created_at: '2026-11-25 09:40:00'
    }
  ];

  const insertOrdersTx = db.transaction((ordersList) => {
    for (const o of ordersList) {
      insertOrder.run(
        o.id, o.customer_name, o.customer_email, o.customer_phone,
        o.destination_country, o.destination_country_name, o.destination_city,
        o.postal_code, o.address_line1, o.items_json, o.total_weight_kg,
        o.subtotal_usd, o.shipping_usd, o.total_usd, o.currency_paid, o.exchange_rate_applied,
        o.subtotal_local, o.shipping_local, o.total_local, o.dhl_service_code, o.dhl_service_name,
        o.dhl_estimated_delivery, o.status, o.created_at
      );
    }
  });

  insertOrdersTx(initialOrders);
  console.log('[Database] Seeded sample international orders.');
}

module.exports = db;
