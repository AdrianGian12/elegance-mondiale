import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { Eye, ShoppingBag, Sparkles, Scale } from 'lucide-react';

export default function ProductCard({ product, onQuickView }) {
  const { formatPrice, currentCurrency } = useCurrency();
  const { addToCart } = useCart();

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200';
  const hoverImage = product.images?.[1] || primaryImage;

  const defaultSize = product.sizes?.[0] || 'M';
  const defaultColor = product.colors?.[0] || { name: 'Noir', hex: '#111827' };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, defaultSize, defaultColor, 1);
  };

  return (
    <div 
      onClick={() => onQuickView(product)}
      className="group relative bg-atelier-900/60 rounded-xl overflow-hidden border border-atelier-800/80 hover:border-gold-500/40 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-atelier-950">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {hoverImage !== primaryImage && (
          <img
            src={hoverImage}
            alt={`${product.name} preview`}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        )}

        {/* Featured Pill */}
        {product.featured === 1 && (
          <div className="absolute top-3 left-3 bg-atelier-950/80 backdrop-blur-md border border-gold-500/40 text-gold-300 text-[10px] tracking-widest uppercase font-mono px-2.5 py-1 rounded-full">
            Édition Limitée
          </div>
        )}

        {/* Weight Badge for DHL calculation clarity */}
        <div className="absolute top-3 right-3 bg-atelier-950/80 backdrop-blur-md border border-atelier-700/80 text-stone-300 text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
          <Scale className="w-3 h-3 text-stone-400" />
          <span>{product.weight_kg} kg</span>
        </div>

        {/* Action Buttons on Hover */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleQuickAdd}
            className="flex-1 bg-gold-400 hover:bg-gold-300 text-atelier-950 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Añadir Rápido</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2.5 bg-atelier-900/90 hover:bg-atelier-800 text-white rounded-lg border border-atelier-700 transition-colors shadow-lg"
            title="Vista detallada"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gold-400 font-mono mb-1">
            {product.category}
          </div>
          
          <h3 className="font-serif text-base text-stone-100 font-medium group-hover:text-gold-200 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Currency Section */}
        <div className="mt-4 pt-3 border-t border-atelier-800/80">
          <div className="flex items-baseline justify-between">
            <div>
              {/* Converted Local Price */}
              <div className="font-serif text-lg font-semibold text-white tracking-wide">
                {formatPrice(product.base_price_usd)}
              </div>
              
              {/* Base USD Reference */}
              {currentCurrency.code !== 'USD' && (
                <div className="text-[10px] text-stone-500 font-mono">
                  Ref. ${product.base_price_usd.toFixed(2)} USD
                </div>
              )}
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1">
              {product.colors?.slice(0, 3).map((col, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-atelier-700 shadow-sm"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Sizes available tags */}
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-stone-400">
            <span className="text-stone-500 font-mono">Tallas:</span>
            {product.sizes?.map((sz, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-atelier-800 text-stone-300 font-mono">
                {sz}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
