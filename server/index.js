const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for development frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-override-country-ip']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust reverse proxies (important for geolocation IP detection behind Nginx/Cloudflare/Heroku/AWS)
app.set('trust proxy', true);

// Initialize DB and APIs
require('./database');
const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build if it exists
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA navigation
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(distPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Élégance Mondiale - Backend API</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #1e293b; padding: 2rem 3rem; border-radius: 12px; border: 1px solid #334155; text-align: center; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              h1 { font-weight: 300; letter-spacing: 2px; color: #d4af37; margin-bottom: 0.5rem; }
              p { color: #94a3b8; line-height: 1.6; }
              a { color: #38bdf8; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>ÉLÉGANCE MONDIALE</h1>
              <p>Servidor backend activo en el puerto <strong>${PORT}</strong>.</p>
              <p>API REST disponible en <a href="/api/products">/api/products</a> y <a href="/api/location">/api/location</a>.</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  ÉLÉGANCE MONDIALE - E-COMMERCE INTERNACIONAL ACTIVO  `);
  console.log(`  Backend en ejecución: http://localhost:${PORT}        `);
  console.log(`  API Geolocation & Currencies: http://localhost:${PORT}/api/location`);
  console.log(`  API DHL Shipping: http://localhost:${PORT}/api/shipping/dhl-quote`);
  console.log(`=======================================================`);
});
