import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('elegance_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('elegance_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1) => {
    setCartItems(prev => {
      // Find if item with same ID, size and color already exists
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor?.name === selectedColor?.name
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            cartId: `${product.id}-${selectedSize}-${selectedColor?.name || 'def'}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            category: product.category,
            price_usd: product.price.baseUsd || product.base_price_usd,
            selectedSize,
            selectedColor,
            quantity,
            weight_kg: product.weight_kg || 0.45,
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.cartId === cartId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Computations
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotalUsd = cartItems.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);
  const totalWeightKg = parseFloat(
    cartItems.reduce((sum, item) => sum + ((item.weight_kg || 0.45) * item.quantity), 0).toFixed(2)
  );

  let packagingEstimate = 'Caja Estándar DHL Express';
  if (totalWeightKg <= 1.0) packagingEstimate = 'Caja DHL S (32x24x8 cm)';
  else if (totalWeightKg <= 3.0) packagingEstimate = 'Caja DHL M (40x30x14 cm)';
  else if (totalWeightKg <= 6.0) packagingEstimate = 'Caja DHL L (48x36x22 cm)';
  else packagingEstimate = 'Cartón Master DHL XL (58x44x32 cm)';

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotalUsd,
      totalWeightKg,
      packagingEstimate
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
