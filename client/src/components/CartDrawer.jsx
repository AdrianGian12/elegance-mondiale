import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { X, Trash2, ShoppingBag, ArrowRight, Plane, Scale, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react';

export default function CartDrawer({ onProceedToCheckout }) {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotalUsd,
    totalWeightKg,
    packagingEstimate
  } = useCart();

  const { currentCountry, currentCurrency, formatPrice, convertPrice } = useCurrency();

  const [postalCode, setPostalCode] = useState(currentCountry.defaultPostal || '');
  const [cityName, setCityName] = useState(currentCountry.defaultCity || '');
  const [dhlRates, setDhlRates] = useState(null);
  const [selectedDhlService, setSelectedDhlService] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [dhlError, setDhlError] = useState(null);

  // Sync city & postal if country changes
  useEffect(() => {
    if (currentCountry.defaultPostal) setPostalCode(currentCountry.defaultPostal);
    if (currentCountry.defaultCity) setCityName(currentCountry.defaultCity);
    setDhlRates(null);
    setSelectedDhlService(null);
  }, [currentCountry]);

  // Quick DHL rate quote inside cart drawer
  const handleCalculateDhlRates = async () => {
    if (!postalCode) {
      setDhlError('Por favor ingresa un código postal para cotizar con DHL.');
      return;
    }

    setIsLoadingRates(true);
    setDhlError(null);

    try {
      const destination = {
        countryCode: currentCountry.code,
        city: cityName,
        postalCode: postalCode
      };

      const res = await api.getDhlQuote(destination, cartItems, currentCurrency.code);
      
      if (res.success && Array.isArray(res.services) && res.services.length > 0) {
        setDhlRates(res.services);
        setSelectedDhlService(res.services[0]);
      } else {
        setDhlError(res.message || 'No se obtuvieron servicios de DHL disponibles para este destino.');
        setDhlRates(null);
      }
    } catch (e) {
      setDhlError('Error al conectar con la API de DHL Express.');
    } finally {
      setIsLoadingRates(false);
    }
  };

  if (!isCartOpen) return null;

  const shippingCostUsd = selectedDhlService ? selectedDhlService.basePriceUsd : 0;
  const totalUsd = subtotalUsd + shippingCostUsd;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
      <div 
        className="w-full max-w-md bg-atelier-950 border-l border-atelier-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-atelier-800 flex items-center justify-between bg-atelier-900/60">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg text-white font-medium">Bolsa de Compras</h3>
            <span className="text-xs bg-atelier-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
              {totalItems} {totalItems === 1 ? 'prenda' : 'prendas'}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-atelier-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Package Consolidation Bar */}
        {cartItems.length > 0 && (
          <div className="px-5 py-2.5 bg-atelier-900 border-b border-atelier-800 flex items-center justify-between text-[11px] text-stone-300 font-mono">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Scale className="w-3.5 h-3.5" />
              <span>Peso total: <strong>{totalWeightKg} kg</strong></span>
            </span>
            <span className="text-stone-400">{packagingEstimate}</span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-atelier-900 border border-atelier-800 flex items-center justify-center mx-auto text-stone-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-stone-400 font-serif text-lg">Tu bolsa de compras está vacía</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Explora nuestra colección internacional con envíos express a {currentCountry.name}.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2.5 rounded-full bg-gold-400 text-atelier-950 font-medium text-xs uppercase tracking-wider"
              >
                Comenzar a Comprar
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.cartId}
                className="flex gap-3.5 p-3 rounded-xl bg-atelier-900/60 border border-atelier-800/80 group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-atelier-950 shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-serif font-medium text-white line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-stone-500 hover:text-red-400 p-1 transition-colors"
                        title="Eliminar prenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span className="font-mono bg-atelier-800 px-1.5 py-0.5 rounded">
                        Talla: {item.selectedSize}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: item.selectedColor?.hex }}
                        />
                        {item.selectedColor?.name}
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                      Peso unitario: {item.weight_kg} kg
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-atelier-800/60">
                    <div className="flex items-center border border-atelier-700 rounded-md bg-atelier-950 overflow-hidden text-xs">
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="px-2 py-0.5 text-stone-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono font-medium text-white text-[11px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="px-2 py-0.5 text-stone-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-serif text-sm font-semibold text-white">
                        {formatPrice(item.price_usd * item.quantity)}
                      </div>
                      {currentCurrency.code !== 'USD' && (
                        <div className="text-[9px] text-stone-500 font-mono">
                          ${(item.price_usd * item.quantity).toFixed(2)} USD
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Quick DHL Shipping Estimator inside Drawer */}
          {cartItems.length > 0 && (
            <div className="p-4 rounded-xl bg-atelier-900 border border-yellow-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-yellow-400">
                  <Plane className="w-4 h-4" />
                  <span>Cotizador DHL Express ({currentCountry.name})</span>
                </div>
                <span className="text-sm">{currentCountry.flag}</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código Postal (ej. 01310-100)"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="flex-1 bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                />
                <button
                  onClick={handleCalculateDhlRates}
                  disabled={isLoadingRates}
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-atelier-950 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
                >
                  {isLoadingRates ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Cotizar</span>
                  )}
                </button>
              </div>

              {/* DHL Quoted Options */}
              {dhlRates && dhlRates.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-atelier-800">
                  {dhlRates.map((srv, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedDhlService(srv)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        selectedDhlService?.serviceCode === srv.serviceCode
                          ? 'bg-yellow-500/10 border-yellow-500 text-white'
                          : 'bg-atelier-950 border-atelier-800 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          <span>{srv.serviceName}</span>
                          {selectedDhlService?.serviceCode === srv.serviceCode && (
                            <Check className="w-3 h-3 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {srv.estimatedDeliveryFormatted}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-yellow-400">
                        {srv.formattedPrice}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dhlError && (
                <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 leading-tight">
                  {dhlError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Subtotals */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-atelier-800 bg-atelier-900/80 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal prendas:</span>
                <span className="font-mono text-stone-200">{formatPrice(subtotalUsd)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span className="flex items-center gap-1">
                  <span>Envío DHL Express:</span>
                  {selectedDhlService && (
                    <span className="text-[10px] text-yellow-400 font-mono">({selectedDhlService.serviceName})</span>
                  )}
                </span>
                <span className="font-mono text-stone-200">
                  {selectedDhlService ? selectedDhlService.formattedPrice : 'Por calcular en checkout'}
                </span>
              </div>
              <div className="flex justify-between text-base font-serif font-semibold text-white pt-2 border-t border-atelier-800">
                <span>Total Estimado ({currentCurrency.code}):</span>
                <span className="font-mono text-gold-300">{formatPrice(totalUsd)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout(selectedDhlService);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gold-400 hover:bg-gold-300 text-atelier-950 font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all hover:shadow-gold-500/20 active:scale-98"
            >
              <span>Proceder al Checkout Internacional</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
