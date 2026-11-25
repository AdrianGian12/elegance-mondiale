import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { X, Search, Globe, Check, RefreshCw, Sparkles, MapPin } from 'lucide-react';

export default function CurrencySelectorModal() {
  const {
    isCurrencyModalOpen,
    setIsCurrencyModalOpen,
    currentCountry,
    currentCurrency,
    supportedCountries,
    setCountryAndCurrency,
    resetToAutomaticLocation,
    lastUpdated,
    exchangeRates
  } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isCurrencyModalOpen) return null;

  const filteredCountries = supportedCountries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularCountries = ['BR', 'PE', 'US', 'MX', 'ES', 'DE', 'GB', 'CO'];

  const handleSelectCountry = (country) => {
    setCountryAndCurrency(country.code, country.currency);
    setIsCurrencyModalOpen(false);
  };

  const handleResetAuto = async () => {
    await resetToAutomaticLocation();
    setIsCurrencyModalOpen(false);
  };

  const formattedUpdateDate = lastUpdated ? new Date(lastUpdated).toLocaleDateString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  }) : 'Recientemente';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-atelier-900 border border-atelier-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-atelier-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-white font-medium">Seleccionar País y Moneda Local</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Los precios y cotizaciones DHL se adaptarán automáticamente a tu divisa oficial.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCurrencyModalOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-atelier-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Auto-detect Quick Bar */}
        <div className="bg-atelier-950/60 p-4 border-b border-atelier-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Selección actual: </span>
            <span className="font-semibold text-white flex items-center gap-1.5 bg-atelier-800 px-2.5 py-1 rounded-full border border-atelier-700">
              <span>{currentCountry.flag}</span>
              <span>{currentCountry.name}</span>
              <span className="text-gold-300 font-mono">({currentCurrency.code} {currentCurrency.symbol})</span>
            </span>
          </div>

          <button
            onClick={handleResetAuto}
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-medium transition-colors bg-gold-500/10 hover:bg-gold-500/20 px-3 py-1.5 rounded-lg border border-gold-500/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Detectar automáticamente por IP</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por país, código o moneda (ej. Brasil, Perú, EUR, BRL, PEN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-atelier-950 border border-atelier-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          {/* Quick Access Badges */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs">
            <span className="text-stone-500 whitespace-nowrap text-[11px] uppercase tracking-wider">Frecuentes:</span>
            {supportedCountries.filter(c => popularCountries.includes(c.code)).map(c => (
              <button
                key={c.code}
                onClick={() => handleSelectCountry(c)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                  currentCountry.code === c.code
                    ? 'bg-gold-500/20 border-gold-500 text-gold-300 font-medium'
                    : 'bg-atelier-800 border-atelier-700 text-stone-300 hover:border-stone-500'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
                <span className="text-stone-400 font-mono text-[10px]">({c.currency})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Countries Grid */}
        <div className="p-6 pt-2 max-h-[360px] overflow-y-auto space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredCountries.map(country => {
              const isSelected = currentCountry.code === country.code;
              const rate = exchangeRates[country.currency] || 1.0;

              return (
                <div
                  key={country.code}
                  onClick={() => handleSelectCountry(country)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500/80 shadow-md ring-1 ring-gold-500/30'
                      : 'bg-atelier-950/60 border-atelier-800 hover:border-atelier-600 hover:bg-atelier-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white group-hover:text-gold-300 transition-colors">
                          {country.name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">({country.code})</span>
                      </div>
                      <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                        <span className="text-gold-400 font-semibold">{country.currency}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-stone-400">1 USD = {rate.toFixed(country.currency === 'JPY' || country.currency === 'COP' ? 1 : 2)} {country.currency}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-gold-500 text-atelier-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              No se encontraron países que coincidan con "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-atelier-950 border-t border-atelier-800 text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Moneda base original: <strong>USD</strong> • Conversión en tiempo real con redondeo oficial</span>
          </div>
          <div className="text-stone-500">
            Última actualización de tasas: {formattedUpdateDate}
          </div>
        </div>
      </div>
    </div>
  );
}
