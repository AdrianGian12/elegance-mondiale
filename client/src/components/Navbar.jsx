import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { Globe, ShoppingBag, ShieldCheck, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenAdmin, onSelectCategory, selectedCategory }) {
  const { currentCountry, currentCurrency, setIsCurrencyModalOpen, isManualOverride, lastUpdated } = useCurrency();
  const { totalItems, setIsCartOpen } = useCart();

  const categories = [
    'Todos',
    'Abrigos y Chaquetas',
    'Vestidos de Gala',
    'Sastrería y Trajes',
    'Camisas y Blusas',
    'Punto y Cachemira'
  ];

  return (
    <header className="sticky top-0 z-40 bg-atelier-950/95 backdrop-blur-md border-b border-atelier-800">
      {/* Top International Announcement Bar */}
      <div className="bg-gradient-to-r from-atelier-900 via-atelier-950 to-atelier-900 py-2 px-4 text-xs border-b border-atelier-800/60">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-light">
              Envíos Internacionales Express vía <strong className="text-yellow-400 font-medium">DHL Express</strong> con cotización oficial en tiempo real
            </span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-gold-300 transition-colors" onClick={() => setIsCurrencyModalOpen(true)}>
              <span>Ubicación detectada:</span>
              <span className="text-white font-medium flex items-center gap-1">
                {currentCountry.flag} {currentCountry.name} ({currentCurrency.code})
              </span>
              <span className="text-[10px] text-gold-400 underline ml-1">Cambiar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu / Brand Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCurrencyModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-atelier-900 border border-atelier-700/80 hover:border-gold-400/60 transition-all text-xs text-stone-200 group"
              title="Seleccionar país y moneda"
            >
              <span className="text-base">{currentCountry.flag}</span>
              <span className="font-semibold text-gold-300">{currentCurrency.code}</span>
              <span className="text-stone-400 font-mono text-[11px] group-hover:text-stone-200">
                ({currentCurrency.symbol})
              </span>
              <Globe className="w-3.5 h-3.5 text-stone-400 group-hover:text-gold-300 transition-colors ml-0.5" />
            </button>
          </div>

          {/* Luxury Logo */}
          <div className="text-center">
            <a href="#" className="inline-block group">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.25em] font-light text-stone-100 group-hover:text-gold-300 transition-colors block">
                ÉLÉGANCE MONDIALE
              </span>
              <span className="text-[9px] uppercase tracking-[0.4em] text-gold-400/80 font-mono block -mt-1">
                Haute Couture • Paris - New York
              </span>
            </a>
          </div>

          {/* Right actions: Admin Panel & Shopping Bag */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-stone-300 bg-atelier-900/80 hover:bg-atelier-800 border border-atelier-700 transition-all hover:text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-400" />
              <span>Panel Admin / DHL</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-atelier-900 border border-atelier-800 hover:border-gold-400/60 transition-all text-stone-200 hover:text-white group"
              aria-label="Ver carrito de compras"
            >
              <ShoppingBag className="w-5 h-5 text-stone-300 group-hover:text-gold-300 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-atelier-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 overflow-x-auto py-2.5 border-t border-atelier-900 text-xs tracking-wider uppercase text-stone-400 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/40 font-medium'
                  : 'hover:text-stone-200 hover:bg-atelier-900/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
