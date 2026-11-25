import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowDown, Plane, ShieldCheck, Sparkles, Clock, Globe } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  const { currentCountry, currentCurrency, setIsCurrencyModalOpen } = useCurrency();

  return (
    <div className="relative overflow-hidden bg-atelier-950 border-b border-atelier-800">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(210,167,100,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop"
          alt="Haute Couture Ambience"
          className="w-full h-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-atelier-950/60 to-atelier-950" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="max-w-2xl">
          {/* International badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-atelier-900 border border-gold-500/30 text-gold-300 text-xs mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-gold-400"></span>
            <span className="tracking-widest uppercase font-mono text-[10px]">COLECCIÓN INTERNACIONAL 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light tracking-tight text-white leading-[1.08] mb-6">
            Lujo Silencioso <br />
            <span className="italic font-normal text-gold-200">Sin Fronteras.</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300 font-light leading-relaxed mb-8 max-w-xl">
            Prendas de alta sastrería confeccionadas con los tejidos más nobles de Europa. Diseñadas para una clientela cosmopolita con entrega urgente express en más de 220 países.
          </p>

          {/* Active Geolocation Pill */}
          <div className="p-4 rounded-xl bg-atelier-900/90 border border-atelier-800 mb-8 max-w-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentCountry.flag}</span>
                <div>
                  <div className="text-xs text-stone-400">Precios y envíos calculados para:</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>{currentCountry.name}</span>
                    <span className="text-gold-400 font-mono">({currentCurrency.code} - {currentCurrency.symbol})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCurrencyModalOpen(true)}
                className="text-xs text-gold-400 hover:text-gold-300 font-medium underline underline-offset-4"
              >
                Cambiar país
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreClick}
              className="px-8 py-4 rounded-full bg-gold-400 hover:bg-gold-300 text-atelier-950 font-medium tracking-wider text-xs uppercase transition-all shadow-lg hover:shadow-gold-500/20 transform hover:-translate-y-0.5"
            >
              Explorar Catálogo
            </button>
            <a
              href="#dhl-guarantee"
              className="px-6 py-4 rounded-full border border-atelier-700 hover:border-gold-400/50 text-stone-300 hover:text-white text-xs tracking-wider uppercase transition-all"
            >
              Garantía DHL Express
            </a>
          </div>
        </div>

        {/* 3 Pillars / Value Props */}
        <div id="dhl-guarantee" className="mt-16 pt-8 border-t border-atelier-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-atelier-900 border border-atelier-800 text-yellow-400 shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Logística Oficial DHL Express</h2>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Cotización en tiempo real vía MyDHL API según peso volumétrico y destino directo a tu puerta.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-atelier-900 border border-atelier-800 text-gold-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Moneda Local Transparente</h2>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Detección IP automática. Visualiza precios en BRL, PEN, USD, EUR, MXN y más sin comisiones ocultas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-atelier-900 border border-atelier-800 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Confección Artesanal Certificada</h2>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Cachemira de Mongolia, lanas superfrecadas italianas y sedas puras con certificación de origen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
