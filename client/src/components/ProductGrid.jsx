import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, Filter, Sparkles } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function ProductGrid({
  products,
  selectedCategory,
  onSelectCategory,
  onQuickView
}) {
  const { currentCountry, currentCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedSize, setSelectedSize] = useState('Todas');
  const [selectedColor, setSelectedColor] = useState('Todos');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc'

  const categories = [
    'Todos',
    'Abrigos y Chaquetas',
    'Vestidos de Gala',
    'Sastrería y Trajes',
    'Camisas y Blusas',
    'Punto y Cachemira'
  ];

  const sizes = ['Todas', 'XS', 'S', 'M', 'L', 'XL'];

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Category
        if (selectedCategory !== 'Todos' && p.category !== selectedCategory) return false;

        // Search
        if (search) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // Size
        if (selectedSize !== 'Todas') {
          if (!p.sizes?.includes(selectedSize)) return false;
        }

        // Color
        if (selectedColor !== 'Todos') {
          const hasCol = p.colors?.some(c => c.name.toLowerCase().includes(selectedColor.toLowerCase()));
          if (!hasCol) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.base_price_usd - b.base_price_usd;
        if (sortBy === 'price-desc') return b.base_price_usd - a.base_price_usd;
        return (b.featured || 0) - (a.featured || 0);
      });
  }, [products, selectedCategory, search, selectedSize, selectedColor, sortBy]);

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Catalog Title & Location Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-atelier-800 pb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-400 font-mono mb-1">
            CATÁLOGO INTERNACIONAL • TEMPORADA 2026
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white font-light">
            Colección Disponible
          </h2>
        </div>

        <div className="text-xs text-stone-400 font-mono bg-atelier-900/80 px-3.5 py-2 rounded-xl border border-atelier-800 flex items-center gap-2">
          <span>Precios convertidos a:</span>
          <span className="text-gold-300 font-bold flex items-center gap-1">
            {currentCountry.flag} {currentCurrency.code} ({currentCurrency.symbol})
          </span>
          <span className="text-stone-500">•</span>
          <span className="text-stone-400">{filteredProducts.length} modelos</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-atelier-900/60 p-4 rounded-2xl border border-atelier-800/80 mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por prenda, tela o corte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-atelier-950 border border-atelier-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-gold-400"
            />
          </div>

          {/* Size Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-mono">Talla:</span>
            <div className="flex-1 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {sizes.map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSize === sz
                      ? 'bg-gold-500/20 text-gold-300 border border-gold-400 font-medium'
                      : 'bg-atelier-950 border border-atelier-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 bg-atelier-950 border border-atelier-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-400"
            >
              <option value="featured">Destacados y Novedades</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>

          {/* Quick Clear */}
          <div className="flex justify-end items-center">
            {(search || selectedSize !== 'Todas' || selectedCategory !== 'Todos') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedSize('Todas');
                  onSelectCategory('Todos');
                }}
                className="text-xs text-gold-400 hover:underline font-mono"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-atelier-900/30 rounded-2xl border border-atelier-800">
          <p className="text-stone-400 font-serif text-xl">No se encontraron prendas con los filtros seleccionados</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedSize('Todas');
              onSelectCategory('Todos');
            }}
            className="mt-4 px-6 py-2.5 rounded-full bg-gold-400 text-atelier-950 text-xs font-medium uppercase tracking-wider"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </section>
  );
}
