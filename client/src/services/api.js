const API_BASE = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.host}/api`
  : 'http://localhost:5050/api';

export const api = {
  // Geolocation & Currency
  async getLocation(simulateCountry = null) {
    const url = simulateCountry ? `${API_BASE}/location?simulateCountry=${simulateCountry}` : `${API_BASE}/location`;
    const res = await fetch(url);
    return res.json();
  },

  async getCountries() {
    const res = await fetch(`${API_BASE}/countries`);
    return res.json();
  },

  async getCurrencies() {
    const res = await fetch(`${API_BASE}/currencies`);
    return res.json();
  },

  async refreshRates() {
    const res = await fetch(`${API_BASE}/currencies/refresh`, { method: 'POST' });
    return res.json();
  },

  // Products
  async getProducts(category = 'Todos', search = '', currency = 'USD') {
    const params = new URLSearchParams();
    if (category && category !== 'Todos') params.append('category', category);
    if (search) params.append('search', search);
    params.append('currency', currency);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    return res.json();
  },

  async getProduct(id, currency = 'USD') {
    const res = await fetch(`${API_BASE}/products/${id}?currency=${currency}`);
    return res.json();
  },

  // DHL Shipping
  async getDhlQuote(destination, cartItems, targetCurrency = 'USD') {
    const res = await fetch(`${API_BASE}/shipping/dhl-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, cartItems, targetCurrency })
    });
    return res.json();
  },

  // Orders
  async createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  // Admin
  async getAdminOrders() {
    const res = await fetch(`${API_BASE}/admin/orders`);
    return res.json();
  },

  async updateOrderStatus(orderId, status) {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  async updateProduct(id, productData) {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getAdminSettings() {
    const res = await fetch(`${API_BASE}/admin/settings`);
    return res.json();
  },

  async updateAdminSettings(settings) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
