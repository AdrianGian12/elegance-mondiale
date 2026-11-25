import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { X, Plane, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft, CreditCard, Lock, Scale, Building2 } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, initialDhlService, onOpenAdmin }) {
  const { cartItems, subtotalUsd, totalWeightKg, packagingEstimate, clearCart } = useCart();
  const { currentCountry, currentCurrency, formatPrice, convertPrice, supportedCountries } = useCurrency();

  // Multi-step: 1 = Shipping Address, 2 = DHL Shipping Service, 3 = Payment & Confirmation, 4 = Success
  const [step, setStep] = useState(1);

  // Form Fields
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [destination, setDestination] = useState({
    countryCode: currentCountry.code,
    countryName: currentCountry.name,
    city: currentCountry.defaultCity || '',
    postalCode: currentCountry.defaultPostal || '',
    address: ''
  });

  // DHL Shipping state
  const [dhlRates, setDhlRates] = useState([]);
  const [selectedDhlService, setSelectedDhlService] = useState(initialDhlService || null);
  const [isLoadingDhl, setIsLoadingDhl] = useState(false);
  const [dhlError, setDhlError] = useState(null);

  // Order result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  useEffect(() => {
    if (initialDhlService) {
      setSelectedDhlService(initialDhlService);
    }
  }, [initialDhlService]);

  useEffect(() => {
    setDestination(prev => ({
      ...prev,
      countryCode: currentCountry.code,
      countryName: currentCountry.name,
      city: currentCountry.defaultCity || prev.city,
      postalCode: currentCountry.defaultPostal || prev.postalCode
    }));
  }, [currentCountry]);

  if (!isOpen) return null;

  // Fetch live DHL shipping quotes
  const fetchDhlRates = async () => {
    setIsLoadingDhl(true);
    setDhlError(null);

    try {
      const res = await api.getDhlQuote(
        {
          countryCode: destination.countryCode,
          postalCode: destination.postalCode,
          city: destination.city,
          address: destination.address
        },
        cartItems,
        currentCurrency.code
      );

      if (res.success && Array.isArray(res.services) && res.services.length > 0) {
        setDhlRates(res.services);
        setSelectedDhlService(res.services[0]);
      } else {
        setDhlRates([]);
        setSelectedDhlService(null);
        setDhlError({
          message: res.message || 'No se encontraron tarifas disponibles en DHL Express para esta dirección.',
          details: res.details,
          errorType: res.errorType
        });
      }
    } catch (err) {
      setDhlError({
        message: 'Error al conectar con el servicio DHL Express.',
        details: err.message
      });
    } finally {
      setIsLoadingDhl(false);
    }
  };

  const handleCountryChange = (code) => {
    const c = supportedCountries.find(x => x.code === code);
    if (c) {
      setDestination({
        countryCode: c.code,
        countryName: c.name,
        city: c.defaultCity || '',
        postalCode: c.defaultPostal || '',
        address: ''
      });
      setDhlRates([]);
      setSelectedDhlService(null);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !destination.postalCode || !destination.city || !destination.address) {
      alert('Por favor completa todos los campos de dirección de envío.');
      return;
    }

    setStep(2);
    await fetchDhlRates();
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        customer,
        destination,
        items: cartItems,
        shippingOption: selectedDhlService,
        currency: currentCurrency.code
      };

      const res = await api.createOrder(orderPayload);
      if (res.success) {
        setOrderConfirmed(res.order);
        clearCart();
        setStep(4);
      } else {
        alert(res.message || 'Error procesando la orden.');
      }
    } catch (e) {
      alert('Error al enviar la orden al servidor: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingUsd = selectedDhlService ? selectedDhlService.basePriceUsd : 0;
  const totalUsd = subtotalUsd + shippingUsd;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div 
        className="relative bg-atelier-900 border border-atelier-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-atelier-800 bg-atelier-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-white font-medium">Checkout Internacional Seguro</h3>
              <p className="text-xs text-stone-400">
                Entrega puerta a puerta con DHL Express • Divisa: <strong className="text-gold-300 font-mono">{currentCurrency.code} ({currentCurrency.symbol})</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-atelier-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-atelier-950 border-b border-atelier-800/80 flex items-center justify-between text-xs font-mono">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-gold-300 font-semibold' : 'text-stone-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-gold-500 text-atelier-950' : 'bg-atelier-800 text-stone-400'}`}>1</span>
            <span>Destino</span>
          </div>
          <div className="h-0.5 w-8 bg-atelier-800"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-gold-300 font-semibold' : 'text-stone-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-gold-500 text-atelier-950' : 'bg-atelier-800 text-stone-400'}`}>2</span>
            <span>DHL Express</span>
          </div>
          <div className="h-0.5 w-8 bg-atelier-800"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-gold-300 font-semibold' : 'text-stone-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-gold-500 text-atelier-950' : 'bg-atelier-800 text-stone-400'}`}>3</span>
            <span>Pago</span>
          </div>
          <div className="h-0.5 w-8 bg-atelier-800"></div>
          <div className={`flex items-center gap-2 ${step === 4 ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-emerald-500 text-atelier-950' : 'bg-atelier-800 text-stone-400'}`}>4</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: DESTINATION & CUSTOMER */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                1. Datos del Cliente y Destino Internacional
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Nombre y Apellidos</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Camila Silva"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="camila@example.com"
                    value={customer.email}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Teléfono Móvil (con código de país)</label>
                  <input
                    type="tel"
                    placeholder="+55 11 98765-4321"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">País de Destino</label>
                  <select
                    value={destination.countryCode}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-400"
                  >
                    {supportedCountries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code} - {c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. São Paulo / Lima / Madrid"
                    value={destination.city}
                    onChange={e => setDestination({ ...destination, city: e.target.value })}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Código Postal (ZIP / CEP)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 01310-100"
                    value={destination.postalCode}
                    onChange={e => setDestination({ ...destination, postalCode: e.target.value })}
                    className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Dirección de Entrega (Calle, Número, Apto)</label>
                <input
                  type="text"
                  required
                  placeholder="Av. Paulista 1000, Apto 402"
                  value={destination.address}
                  onChange={e => setDestination({ ...destination, address: e.target.value })}
                  className="w-full bg-atelier-950 border border-atelier-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="p-3 bg-atelier-950/80 rounded-lg border border-atelier-800 flex items-center justify-between text-xs text-stone-400 font-mono">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Peso paquete a cotizar: {totalWeightKg} kg</span>
                </span>
                <span>{packagingEstimate}</span>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gold-400 hover:bg-gold-300 text-atelier-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <span>Calcular Tarifas DHL Express</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DHL SHIPPING SERVICES */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Plane className="w-4 h-4 text-yellow-400" />
                    <span>2. Tarifas Oficiales DHL Express MyDHL API</span>
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Destino: {destination.city}, {destination.countryName} ({destination.postalCode}) • Peso: {totalWeightKg} kg
                  </p>
                </div>
                <button
                  onClick={fetchDhlRates}
                  disabled={isLoadingDhl}
                  className="text-xs text-gold-400 hover:underline flex items-center gap-1"
                >
                  Recalcular
                </button>
              </div>

              {isLoadingDhl ? (
                <div className="py-12 text-center space-y-3 bg-atelier-950 rounded-xl border border-atelier-800">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto" />
                  <p className="text-xs text-stone-300 font-mono">
                    Conectando con DHL Express MyDHL API para cotizar envío internacional...
                  </p>
                </div>
              ) : dhlRates && dhlRates.length > 0 ? (
                <div className="space-y-3">
                  {dhlRates.map((srv, idx) => {
                    const isSelected = selectedDhlService?.serviceCode === srv.serviceCode;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDhlService(srv)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-yellow-500/10 border-yellow-400 ring-1 ring-yellow-400/40 text-white'
                            : 'bg-atelier-950 border-atelier-800 text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-yellow-400 text-atelier-950' : 'bg-atelier-800 text-stone-400'}`}>
                            <Plane className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span>{srv.serviceName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-atelier-800 text-yellow-400">
                                {srv.serviceCode}
                              </span>
                            </div>
                            <div className="text-xs text-stone-400 mt-0.5">
                              Entrega estimada: <strong className="text-stone-200">{srv.estimatedDeliveryFormatted}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-serif text-lg font-bold text-yellow-400 font-mono">
                            {srv.formattedPrice}
                          </div>
                          {currentCurrency.code !== 'USD' && (
                            <div className="text-[10px] text-stone-500 font-mono">
                              Ref. ${srv.basePriceUsd} USD
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-amber-300">
                        {dhlError?.message || 'Servicio de envío no disponible'}
                      </h5>
                      {dhlError?.details && (
                        <p className="text-[11px] text-amber-200/80 mt-1 font-mono">
                          {dhlError.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-amber-200/70">
                      ¿Necesitas configurar las credenciales de MyDHL API en el backend?
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="px-3 py-1 rounded bg-amber-400 text-atelier-950 font-semibold text-[11px]"
                    >
                      Ir al Panel Admin DHL
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-atelier-700 text-stone-300 text-xs flex items-center gap-2 hover:bg-atelier-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  disabled={!selectedDhlService}
                  onClick={() => setStep(3)}
                  className={`px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center gap-2 ${
                    selectedDhlService
                      ? 'bg-gold-400 hover:bg-gold-300 text-atelier-950'
                      : 'bg-atelier-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar al Pago</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT & FINANCIAL SUMMARY */}
          {step === 3 && (
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                3. Resumen Financiero y Pago
              </h4>

              {/* Order Breakdown in Local Currency */}
              <div className="p-4 rounded-xl bg-atelier-950 border border-atelier-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Prendas ({cartItems.length} tipos):</span>
                  <span className="font-mono text-white">{formatPrice(subtotalUsd)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Envío Internacional DHL Express ({selectedDhlService?.serviceName}):</span>
                  <span className="font-mono text-yellow-400 font-semibold">{selectedDhlService?.formattedPrice}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Tiempo estimado de entrega:</span>
                  <span className="font-mono text-stone-200">{selectedDhlService?.estimatedDeliveryFormatted}</span>
                </div>
                <div className="pt-2 border-t border-atelier-800 flex justify-between text-base font-serif font-bold text-white">
                  <span>Total Final a Pagar ({currentCurrency.code}):</span>
                  <span className="text-gold-300 font-mono">{formatPrice(totalUsd)}</span>
                </div>
                {currentCurrency.code !== 'USD' && (
                  <div className="text-[10px] text-stone-500 font-mono text-right">
                    Equivalente original: ${totalUsd.toFixed(2)} USD (Tasa de cambio aplicada: {currentCurrency.rate})
                  </div>
                )}
              </div>

              {/* Payment simulation */}
              <div className="p-4 rounded-xl bg-atelier-950/80 border border-atelier-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <CreditCard className="w-4 h-4 text-gold-400" />
                  <span>Método de Pago Internacional</span>
                </div>

                <div className="p-3 rounded-lg bg-atelier-900 border border-gold-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Tarjeta de Crédito / Débito Internacional (Visa, Mastercard, Amex)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">256-bit SSL</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-400 mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      readOnly
                      value="•••• •••• •••• 4242"
                      className="w-full bg-atelier-900 border border-atelier-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Titular</label>
                    <input
                      type="text"
                      readOnly
                      value={customer.name}
                      className="w-full bg-atelier-900 border border-atelier-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-atelier-700 text-stone-300 text-xs flex items-center gap-2 hover:bg-atelier-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={handleCompleteOrder}
                  className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando Orden...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirmar y Pagar {formatPrice(totalUsd)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && orderConfirmed && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h4 className="font-serif text-2xl text-white">
                ¡Gracias por su compra, {orderConfirmed.customer.name}!
              </h4>

              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Su orden ha sido registrada exitosamente. Recibirá una confirmación en <strong>{orderConfirmed.customer.email}</strong> y la notificación de recogida de DHL Express.
              </p>

              <div className="p-4 rounded-xl bg-atelier-950 border border-atelier-800 text-left max-w-md mx-auto text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">ID de Orden:</span>
                  <span className="text-gold-300 font-bold">{orderConfirmed.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Destino:</span>
                  <span className="text-white">{orderConfirmed.destination.city}, {orderConfirmed.destination.countryCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Servicio DHL:</span>
                  <span className="text-yellow-400">{orderConfirmed.shippingOption?.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total pagado:</span>
                  <span className="text-white font-bold">{orderConfirmed.financials.currency} {orderConfirmed.financials.totalLocal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-gold-400 text-atelier-950 font-semibold text-xs uppercase tracking-wider"
                >
                  Volver a la Tienda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
