import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

function getInitialCart() {
  try {
    const saved = localStorage.getItem("artisan-cart");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem("artisan-cart");
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(getInitialCart);
  const [savedForLater, setSavedForLater] = useState(() => {
    const saved = localStorage.getItem("artisan-save-later");
    return saved ? JSON.parse(saved) : [];
  });

  function saveCart(nextItems) {
    setItems(nextItems);
    localStorage.setItem("artisan-cart", JSON.stringify(nextItems));
  }

  function addToCart(product) {
    const existing = items.find(item => item._id === product._id);

    if (existing) {
      saveCart(
        items.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      return;
    }

    saveCart([...items, { ...product, quantity: 1 }]);
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      saveCart(items.filter(item => item._id !== productId));
      return;
    }

    saveCart(items.map(item => (item._id === productId ? { ...item, quantity } : item)));
  }

  function clearCart() {
    saveCart([]);
  }

  function saveForLater(productId) {
    const item = items.find(entry => entry._id === productId);

    if (!item) {
      return;
    }

    const nextSaved = [...savedForLater.filter(entry => entry._id !== productId), item];
    setSavedForLater(nextSaved);
    localStorage.setItem("artisan-save-later", JSON.stringify(nextSaved));
    saveCart(items.filter(entry => entry._id !== productId));
  }

  function moveToCart(productId) {
    const item = savedForLater.find(entry => entry._id === productId);

    if (!item) {
      return;
    }

    addToCart(item);
    const nextSaved = savedForLater.filter(entry => entry._id !== productId);
    setSavedForLater(nextSaved);
    localStorage.setItem("artisan-save-later", JSON.stringify(nextSaved));
  }

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 2500 || subtotal === 0 ? 0 : 80;
    const total = subtotal + deliveryFee;

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total,
      savedForLater,
      addToCart,
      updateQuantity,
      clearCart,
      saveForLater,
      moveToCart
    };
  }, [items, savedForLater]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
