import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { X, ShoppingBag, Scale, Box, ShieldCheck, Plane, Check, Sparkles } from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;

  const { formatPrice, currentCurrency } = useCurrency();
  const { addToCart } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || { name: 'Noir', hex: '#111827' });
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200'];

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div 
        className="relative bg-atelier-900 border border-atelier-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-white rounded-full bg-atelier-950/70 hover:bg-atelier-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="md:w-1/2 bg-atelier-950 flex flex-col justify-between p-4 overflow-y-auto">
          <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-atelier-950 relative">
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 mt-3 justify-center">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-gold-400 scale-105' : 'border-atelier-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Form */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold-400 font-mono mb-2">
              {product.category}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium mb-3">
              {product.name}
            </h2>

            {/* Price section */}
            <div className="mb-6 p-3.5 rounded-xl bg-atelier-950 border border-atelier-800 flex items-baseline justify-between">
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                  {formatPrice(product.base_price_usd)}
                </span>
                {currentCurrency.code !== 'USD' && (
                  <span className="text-xs text-stone-400 font-mono ml-2">
                    (Precio original: ${product.base_price_usd.toFixed(2)} USD)
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/30">
                {currentCurrency.code}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Color Selection */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider text-stone-400 font-mono mb-2">
                Color: <strong className="text-white normal-case font-sans ml-1">{selectedColor?.name}</strong>
              </label>
              <div className="flex items-center gap-2.5">
                {product.colors?.map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(col)}
                    className={`p-1 rounded-full border-2 transition-all ${
                      selectedColor?.name === col.name ? 'border-gold-400 scale-110 ring-2 ring-gold-400/20' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full block border border-atelier-700 shadow-inner"
                      style={{ backgroundColor: col.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-stone-400 font-mono">
                  Talla:
                </label>
                <span className="text-[11px] text-stone-500 underline cursor-pointer hover:text-gold-300">
                  Guía de tallas internacional
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.sizes?.map((sz, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                      selectedSize === sz
                        ? 'bg-gold-500/20 border-gold-400 text-gold-300 shadow-sm'
                        : 'bg-atelier-950 border-atelier-800 text-stone-300 hover:border-stone-600'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Logistics & Packaging specs for DHL */}
            <div className="p-3 rounded-lg bg-atelier-950/80 border border-atelier-800 text-xs text-stone-400 space-y-1.5 mb-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-stone-400" />
                  <span>Peso de la prenda:</span>
                </span>
                <span className="font-mono text-stone-200">{product.weight_kg} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-stone-400" />
                  <span>Dimensiones de paquete:</span>
                </span>
                <span className="font-mono text-stone-200">
                  {product.length_cm} × {product.width_cm} × {product.height_cm} cm
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1 border-t border-atelier-800/80">
                <Plane className="w-3.5 h-3.5 shrink-0" />
                <span>Listo para despacho prioritario vía DHL Express</span>
              </div>
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="pt-4 border-t border-atelier-800">
            <div className="flex items-center gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-atelier-700 rounded-xl bg-atelier-950 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-3 text-stone-400 hover:text-white transition-colors"
                >
                  -
                </button>
                <span className="px-3 font-mono text-xs font-semibold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-3 text-stone-400 hover:text-white transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addedAnimation}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all shadow-xl ${
                  addedAnimation
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gold-400 hover:bg-gold-300 text-atelier-950 hover:shadow-gold-500/20 active:scale-98'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Añadido a la Bolsa!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Añadir a la Bolsa de Compras</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
