import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  X, LayoutDashboard, ShoppingBag, Settings, Plane, Globe,
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, RefreshCw,
  Scale, DollarSign, Package, Shield, ExternalLink, Save, Loader2
} from 'lucide-react';

export default function AdminPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'settings'

  // Orders State
  const [ordersData, setOrdersData] = useState({ orders: [], stats: {} });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Products State
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    category: 'Abrigos y Chaquetas',
    base_price_usd: 500,
    stock: 10,
    weight_kg: 0.8,
    length_cm: 35,
    width_cm: 25,
    height_cm: 6,
    sizes: 'XS, S, M, L, XL',
    colors: 'Negro:#111827, Camel:#c19a6b',
    images: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200',
    featured: 0
  });

  // Settings State
  const [settings, setSettings] = useState({
    dhl_api_key: '',
    dhl_api_secret: '',
    dhl_account_number: '',
    dhl_is_sandbox: 'true',
    origin_country_code: 'US',
    origin_city: 'New York',
    origin_postal_code: '10001',
    origin_address: '5th Avenue Fashion District, Suite 400',
    currency_api_key: '',
    store_name: 'ÉLÉGANCE MONDIALE'
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      loadProducts();
      loadSettings();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await api.getAdminOrders();
      if (res.success) setOrdersData(res);
    } catch (e) {
      console.error('Error loading orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.getProducts('Todos', '', 'USD');
      if (res.success) setProducts(res.products);
    } catch (e) {
      console.error('Error loading products:', e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await api.getAdminSettings();
      if (res.success) setSettings(res.settings);
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (e) {
      alert('Error actualizando estado de la orden');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      // Parse sizes array
      const parsedSizes = typeof productForm.sizes === 'string'
        ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
        : productForm.sizes;

      // Parse colors array "Name:#hex, Name2:#hex"
      let parsedColors = [];
      if (typeof productForm.colors === 'string') {
        parsedColors = productForm.colors.split(',').map(pair => {
          const parts = pair.split(':');
          return {
            name: parts[0] ? parts[0].trim() : 'Color',
            hex: parts[1] ? parts[1].trim() : '#18181b'
          };
        });
      } else {
        parsedColors = productForm.colors;
      }

      // Parse images array
      const parsedImages = typeof productForm.images === 'string'
        ? productForm.images.split('\n').map(i => i.trim()).filter(Boolean)
        : productForm.images;

      const payload = {
        ...productForm,
        sizes: parsedSizes,
        colors: parsedColors,
        images: parsedImages
      };

      if (productForm.id) {
        await api.updateProduct(productForm.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsEditingProduct(false);
      loadProducts();
    } catch (e) {
      alert('Error guardando producto: ' + e.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta prenda del catálogo?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (e) {
      alert('Error eliminando producto');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminSettings(settings);
      setSettingsSavedMessage('¡Configuraciones de DHL Express y Divisas guardadas con éxito!');
      setTimeout(() => setSettingsSavedMessage(null), 4000);
      loadSettings();
    } catch (e) {
      alert('Error guardando configuraciones');
    }
  };

  const handleForceRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      const res = await api.refreshRates();
      if (res.success) {
        alert('Tipos de cambio actualizados en tiempo real.');
      }
    } catch (e) {
      alert('Error actualizando divisas');
    } finally {
      setIsRefreshingRates(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div 
        className="relative bg-atelier-950 border border-atelier-700/80 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-atelier-800 bg-atelier-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-white font-medium">Panel de Administración Internacional</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Gestión de pedidos, catálogo en moneda base USD y configuración de MyDHL API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-atelier-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-atelier-800 bg-atelier-900/40 px-6 gap-6 text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'border-gold-400 text-gold-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pedidos y Envíos DHL ({ordersData.orders?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'border-gold-400 text-gold-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo de Prendas ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'border-gold-400 text-gold-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración DHL Express & APIs</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: ORDERS & METRICS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-atelier-900 border border-atelier-800">
                  <div className="text-stone-400 text-xs font-mono">Ventas Totales (USD)</div>
                  <div className="text-2xl font-serif font-bold text-white mt-1">
                    ${ordersData.stats?.totalRevenueUsd?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Moneda base original</div>
                </div>

                <div className="p-4 rounded-xl bg-atelier-900 border border-atelier-800">
                  <div className="text-stone-400 text-xs font-mono">Envíos DHL Facturados</div>
                  <div className="text-2xl font-serif font-bold text-yellow-400 mt-1">
                    ${ordersData.stats?.totalShippingCollectedUsd?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Cotizados vía MyDHL API</div>
                </div>

                <div className="p-4 rounded-xl bg-atelier-900 border border-atelier-800">
                  <div className="text-stone-400 text-xs font-mono">Total Pedidos</div>
                  <div className="text-2xl font-serif font-bold text-white mt-1">
                    {ordersData.stats?.totalOrders || 0}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Transacciones procesadas</div>
                </div>

                <div className="p-4 rounded-xl bg-atelier-900 border border-atelier-800">
                  <div className="text-stone-400 text-xs font-mono">Países con Compras</div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {Object.keys(ordersData.stats?.countryBreakdown || {}).map(code => (
                      <span key={code} className="px-2 py-0.5 rounded bg-atelier-800 text-gold-300 font-mono text-xs border border-atelier-700">
                        {code}: {ordersData.stats.countryBreakdown[code]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-atelier-900 border border-atelier-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-atelier-800 flex justify-between items-center">
                  <h4 className="font-serif text-base text-white">Historial de Órdenes Internacionales</h4>
                  <button onClick={loadOrders} className="text-xs text-gold-400 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualizar</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-atelier-950 text-stone-400 font-mono uppercase text-[10px] border-b border-atelier-800">
                      <tr>
                        <th className="p-3">ID / Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Destino</th>
                        <th className="p-3">Servicio DHL</th>
                        <th className="p-3">Peso</th>
                        <th className="p-3">Total (Local)</th>
                        <th className="p-3">Total (USD)</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-atelier-800 font-mono">
                      {ordersData.orders?.map(order => (
                        <tr key={order.id} className="hover:bg-atelier-800/40">
                          <td className="p-3">
                            <div className="font-bold text-white">{order.id}</div>
                            <div className="text-[10px] text-stone-500">{order.created_at}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-sans font-medium text-stone-200">{order.customer_name}</div>
                            <div className="text-[10px] text-stone-500">{order.customer_email}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-stone-200">{order.destination_country}</span>
                            <span className="text-stone-400 font-sans ml-1">({order.destination_city})</span>
                            <div className="text-[10px] text-stone-500">{order.postal_code}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-yellow-400 font-sans font-medium">{order.dhl_service_name}</div>
                            <div className="text-[10px] text-stone-400">{order.dhl_service_code}</div>
                          </td>
                          <td className="p-3 text-stone-300">
                            {order.total_weight_kg} kg
                          </td>
                          <td className="p-3 font-semibold text-gold-300">
                            {order.currency_paid} {order.total_local.toFixed(2)}
                            <div className="text-[9px] text-stone-500 font-normal">
                              Tasa: {order.exchange_rate_applied}
                            </div>
                          </td>
                          <td className="p-3 text-stone-200">
                            ${order.total_usd.toFixed(2)}
                          </td>
                          <td className="p-3">
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-atelier-950 border border-atelier-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-gold-400"
                            >
                              <option value="confirmed">Confirmado</option>
                              <option value="processing">En Preparación</option>
                              <option value="shipped">Despachado DHL</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOG MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-lg text-white">Catálogo de Prendas</h4>
                  <p className="text-xs text-stone-400">
                    Los precios se registran exclusivamente en <strong>USD</strong>. El backend convierte automáticamente a monedas internacionales sin alterar la base de datos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProductForm({
                      id: null,
                      name: '',
                      description: '',
                      category: 'Abrigos y Chaquetas',
                      base_price_usd: 650,
                      stock: 10,
                      weight_kg: 0.9,
                      length_cm: 40,
                      width_cm: 30,
                      height_cm: 8,
                      sizes: 'XS, S, M, L, XL',
                      colors: 'Negro:#111827, Camel:#c19a6b',
                      images: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200',
                      featured: 0
                    });
                    setIsEditingProduct(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-atelier-950 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Nueva Prenda</span>
                </button>
              </div>

              {/* Product Form Modal */}
              {isEditingProduct && (
                <div className="p-5 rounded-xl bg-atelier-900 border border-gold-500/40 space-y-4">
                  <h5 className="font-serif text-base text-gold-300 font-medium">
                    {productForm.id ? 'Editar Prenda' : 'Registrar Nueva Prenda de Lujo'}
                  </h5>
                  <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-400 mb-1">Nombre de la Prenda</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 mb-1">Categoría</label>
                        <select
                          value={productForm.category}
                          onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white"
                        >
                          <option value="Abrigos y Chaquetas">Abrigos y Chaquetas</option>
                          <option value="Vestidos de Gala">Vestidos de Gala</option>
                          <option value="Sastrería y Trajes">Sastrería y Trajes</option>
                          <option value="Camisas y Blusas">Camisas y Blusas</option>
                          <option value="Punto y Cachemira">Punto y Cachemira</option>
                          <option value="Faldas y Conjuntos">Faldas y Conjuntos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-400 mb-1">Precio Base Oficial (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.base_price_usd}
                          onChange={e => setProductForm({ ...productForm, base_price_usd: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Descripción y Detalles de Fabricación</label>
                      <textarea
                        rows="2"
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white"
                      />
                    </div>

                    {/* Weight and Dimensions for DHL rates */}
                    <div className="p-3 bg-atelier-950 rounded-lg border border-atelier-800 space-y-2">
                      <div className="text-yellow-400 font-mono text-[11px] flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Métricas de Paquete para Cotización DHL Express (Obligatorio)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-stone-500 text-[10px]">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.05"
                            required
                            value={productForm.weight_kg}
                            onChange={e => setProductForm({ ...productForm, weight_kg: e.target.value })}
                            className="w-full bg-atelier-900 border border-atelier-700 rounded p-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px]">Largo (cm)</label>
                          <input
                            type="number"
                            value={productForm.length_cm}
                            onChange={e => setProductForm({ ...productForm, length_cm: e.target.value })}
                            className="w-full bg-atelier-900 border border-atelier-700 rounded p-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px]">Ancho (cm)</label>
                          <input
                            type="number"
                            value={productForm.width_cm}
                            onChange={e => setProductForm({ ...productForm, width_cm: e.target.value })}
                            className="w-full bg-atelier-900 border border-atelier-700 rounded p-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px]">Alto (cm)</label>
                          <input
                            type="number"
                            value={productForm.height_cm}
                            onChange={e => setProductForm({ ...productForm, height_cm: e.target.value })}
                            className="w-full bg-atelier-900 border border-atelier-700 rounded p-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-400 mb-1">Tallas disponibles (separadas por coma)</label>
                        <input
                          type="text"
                          value={productForm.sizes}
                          onChange={e => setProductForm({ ...productForm, sizes: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-400 mb-1">Colores (Formato: Nombre:#hex, ...)</label>
                        <input
                          type="text"
                          value={productForm.colors}
                          onChange={e => setProductForm({ ...productForm, colors: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">URLs de Fotografías (una por línea)</label>
                      <textarea
                        rows="2"
                        value={productForm.images}
                        onChange={e => setProductForm({ ...productForm, images: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProduct(false)}
                        className="px-4 py-2 rounded-lg border border-atelier-700 text-stone-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-gold-400 text-atelier-950 font-semibold"
                      >
                        Guardar Prenda
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-atelier-900 border border-atelier-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-atelier-950 text-stone-400 font-mono uppercase text-[10px] border-b border-atelier-800">
                    <tr>
                      <th className="p-3">Prenda</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Precio Base (USD)</th>
                      <th className="p-3">Peso / Dim.</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-atelier-800">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-atelier-800/40">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={p.images?.[0]}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded bg-atelier-950"
                          />
                          <div>
                            <div className="font-serif font-medium text-white">{p.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono">ID: #{p.id}</div>
                          </div>
                        </td>
                        <td className="p-3 text-stone-300 font-sans">{p.category}</td>
                        <td className="p-3 font-mono font-semibold text-gold-300">
                          ${p.base_price_usd.toFixed(2)} USD
                        </td>
                        <td className="p-3 font-mono text-stone-300">
                          {p.weight_kg} kg <br />
                          <span className="text-[10px] text-stone-500">{p.length_cm}x{p.width_cm}x{p.height_cm} cm</span>
                        </td>
                        <td className="p-3 font-mono text-stone-300">{p.stock} uds</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setProductForm({
                                  id: p.id,
                                  name: p.name,
                                  description: p.description,
                                  category: p.category,
                                  base_price_usd: p.base_price_usd,
                                  stock: p.stock,
                                  weight_kg: p.weight_kg,
                                  length_cm: p.length_cm,
                                  width_cm: p.width_cm,
                                  height_cm: p.height_cm,
                                  sizes: p.sizes?.join(', ') || 'M',
                                  colors: p.colors?.map(c => `${c.name}:${c.hex}`).join(', ') || '',
                                  images: p.images?.join('\n') || '',
                                  featured: p.featured || 0
                                });
                                setIsEditingProduct(true);
                              }}
                              className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-atelier-800"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-stone-400 hover:text-red-400 rounded hover:bg-atelier-800"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & DHL CREDENTIALS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h4 className="font-serif text-lg text-white">Credenciales Oficiales DHL Express y Divisas</h4>
                <p className="text-xs text-stone-400">
                  Configura tus claves oficiales de DHL Express MyDHL API. Todas las credenciales se almacenan de forma segura en el backend y nunca se exponen al cliente.
                </p>
              </div>

              {settingsSavedMessage && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{settingsSavedMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                {/* DHL Express API Box */}
                <div className="p-5 rounded-xl bg-atelier-900 border border-yellow-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400 font-semibold font-mono text-sm">
                      <Plane className="w-4 h-4" />
                      <span>DHL Express MyDHL API (Oficial)</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">Endpoints REST v2</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-400 mb-1">DHL Express API Key</label>
                      <input
                        type="text"
                        placeholder="Ej. dhl_client_id_xxxxxxxx"
                        value={settings.dhl_api_key || ''}
                        onChange={e => setSettings({ ...settings, dhl_api_key: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 mb-1">DHL Express API Secret</label>
                      <input
                        type="password"
                        placeholder={settings.dhl_api_secret_masked || '••••••••••••••••'}
                        value={settings.dhl_api_secret || ''}
                        onChange={e => setSettings({ ...settings, dhl_api_secret: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-400 mb-1">Número de Cuenta DHL Shipper (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. 123456789 (9 dígitos)"
                        value={settings.dhl_account_number || ''}
                        onChange={e => setSettings({ ...settings, dhl_account_number: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 mb-1">Entorno API</label>
                      <select
                        value={settings.dhl_is_sandbox}
                        onChange={e => setSettings({ ...settings, dhl_is_sandbox: e.target.value })}
                        className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2.5 text-white font-mono"
                      >
                        <option value="true">Sandbox / Pruebas (express.api.dhl.com/mydhlapi/test)</option>
                        <option value="false">Producción Oficial (express.api.dhl.com/mydhlapi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Origin Warehouse */}
                  <div className="pt-3 border-t border-atelier-800">
                    <div className="text-stone-300 font-medium mb-2 font-mono text-[11px]">
                      📍 Dirección de Origen del Almacén (Remitente Shipper)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-stone-500 text-[10px]">País Origen (ISO)</label>
                        <input
                          type="text"
                          value={settings.origin_country_code || 'US'}
                          onChange={e => setSettings({ ...settings, origin_country_code: e.target.value.toUpperCase() })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded p-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 text-[10px]">Ciudad Origen</label>
                        <input
                          type="text"
                          value={settings.origin_city || 'New York'}
                          onChange={e => setSettings({ ...settings, origin_city: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded p-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 text-[10px]">Código Postal Origen</label>
                        <input
                          type="text"
                          value={settings.origin_postal_code || '10001'}
                          onChange={e => setSettings({ ...settings, origin_postal_code: e.target.value })}
                          className="w-full bg-atelier-950 border border-atelier-700 rounded p-1.5 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Currency API Box */}
                <div className="p-5 rounded-xl bg-atelier-900 border border-atelier-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gold-400 font-semibold font-mono text-sm">
                      <Globe className="w-4 h-4" />
                      <span>API de Conversión de Divisas en Tiempo Real</span>
                    </div>
                    <button
                      type="button"
                      disabled={isRefreshingRates}
                      onClick={handleForceRefreshRates}
                      className="px-3 py-1 rounded bg-atelier-800 hover:bg-atelier-700 text-gold-300 border border-atelier-700 flex items-center gap-1.5 text-xs font-mono"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                      <span>Actualizar Tasas Ahora</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">
                      API Key de ExchangeRate-API (Opcional - por defecto utiliza endpoints abiertos de alta fidelidad)
                    </label>
                    <input
                      type="text"
                      placeholder="Dejar en blanco para usar proveedores abiertos automáticos"
                      value={settings.currency_api_key || ''}
                      onChange={e => setSettings({ ...settings, currency_api_key: e.target.value })}
                      className="w-full bg-atelier-950 border border-atelier-700 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-gold-400 hover:bg-gold-300 text-atelier-950 font-semibold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Toda la Configuración</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
