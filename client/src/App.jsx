import React, { useState, useEffect } from 'react';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { CartProvider, useCart } from './context/CartContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CurrencySelectorModal from './components/CurrencySelectorModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import { Plane, ShieldCheck, RefreshCw, Globe, HelpCircle, Lock } from 'lucide-react';

function MainStore() {
  const { currentCurrency, currentCountry, setIsCurrencyModalOpen } = useCurrency();
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [checkoutInitialDhlService, setCheckoutInitialDhlService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products whenever selected currency changes to get updated formatted prices
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setIsLoading(true);
        const res = await api.getProducts('Todos', '', currentCurrency.code);
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalog();
  }, [currentCurrency.code]);

  const handleProceedToCheckout = (dhlService) => {
    setCheckoutInitialDhlService(dhlService);
    setIsCheckoutOpen(true);
  };

  const handleScrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-atelier-950 text-stone-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Hero Section */}
      <Hero onExploreClick={handleScrollToCatalog} />

      {/* Main Catalog */}
      <main className="flex-1">
        <ProductGrid
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onQuickView={product => setActiveProductModal(product)}
        />
      </main>

      {/* Luxury Footer */}
      <footer className="bg-atelier-950 border-t border-atelier-800/80 pt-16 pb-12 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <span className="font-serif text-2xl tracking-[0.2em] font-light text-white block">
                ÉLÉGANCE MONDIALE
              </span>
              <p className="text-stone-400 leading-relaxed font-light">
                Maison de haute couture dedicada a la confección de piezas exclusivas con alcance global y entrega express prioritaria en más de 220 países.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gold-400 font-mono">Paris • New York • Milan • Tokyo</span>
              </div>
            </div>

            {/* Col 2: DHL Express Logistics */}
            <div className="space-y-3">
              <h4 className="font-mono text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-yellow-400" />
                <span>Logística Internacional DHL</span>
              </h4>
              <ul className="space-y-2 text-stone-400 font-light">
                <li>• Cotización oficial en tiempo real vía MyDHL API</li>
                <li>• Despacho aéreo express (2-4 días hábiles)</li>
                <li>• Seguimiento puerta a puerta garantizado</li>
                <li>• Embalaje de alta protección antichoque</li>
              </ul>
            </div>

            {/* Col 3: Currency & Detection */}
            <div className="space-y-3">
              <h4 className="font-mono text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-gold-400" />
                <span>Detección y Moneda Local</span>
              </h4>
              <p className="text-stone-400 leading-relaxed font-light">
                Detectamos tu país de origen por geolocalización IP. Actualmente visualizando en:
              </p>
              <button
                onClick={() => setIsCurrencyModalOpen(true)}
                className="p-2.5 rounded-lg bg-atelier-900 border border-atelier-800 hover:border-gold-400 flex items-center justify-between w-full text-stone-200 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span>{currentCountry.flag}</span>
                  <span>{currentCountry.name}</span>
                </span>
                <span className="text-gold-300 font-mono">({currentCurrency.code})</span>
              </button>
            </div>

            {/* Col 4: Trust & Admin shortcut */}
            <div className="space-y-3">
              <h4 className="font-mono text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Seguridad y Privacidad</span>
              </h4>
              <p className="text-stone-400 leading-relaxed font-light">
                Transacciones protegidas con cifrado TLS 1.3 de 256 bits. Precios originales conservados en base USD.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-atelier-900 hover:bg-atelier-800 border border-atelier-700 text-stone-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5"
                >
                  <span>Acceso Panel de Administración</span>
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-atelier-900 flex flex-wrap items-center justify-between gap-4 text-stone-500 font-mono text-[11px]">
            <div>
              © 2026 ÉLÉGANCE MONDIALE. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-4">
              <span>MyDHL API Express Integration</span>
              <span>•</span>
              <span>Live Currency Engine</span>
              <span>•</span>
              <span>IP Geolocation System</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={activeProductModal}
        onClose={() => setActiveProductModal(null)}
      />

      <CurrencySelectorModal />

      <CartDrawer
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        initialDhlService={checkoutInitialDhlService}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <CartProvider>
        <MainStore />
      </CartProvider>
    </CurrencyProvider>
  );
}
