'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/api';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  compare_price?: number | null;
  image: string | null;
  stock: number;
  vendor_name?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cretzo_marketplace_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items, isLoaded]);

  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const compareNum = product.compare_price
      ? typeof product.compare_price === 'string'
        ? parseFloat(product.compare_price)
        : product.compare_price
      : null;

    const existingIndex = items.findIndex((i) => i.id === product.id);

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      const targetQty = currentQty + quantity;

      if (targetQty > product.stock) {
        return {
          success: false,
          message: `Cannot add more. Maximum available stock is ${product.stock}.`,
        };
      }

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: targetQty, stock: product.stock } : item
        )
      );
      return { success: true, message: `Updated "${product.name}" quantity to ${targetQty}.` };
    } else {
      if (quantity > product.stock) {
        return {
          success: false,
          message: `Cannot add ${quantity} units. Available stock is only ${product.stock}.`,
        };
      }

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: priceNum,
        compare_price: compareNum,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        stock: product.stock,
        vendor_name: product.vendor_name,
        quantity: quantity,
      };

      setItems((prev) => [...prev, newItem]);
      return { success: true, message: `Added "${product.name}" to cart.` };
    }
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const item = items.find((i) => i.id === productId);
    if (!item) return { success: false, message: 'Item not in cart' };

    if (quantity > item.stock) {
      return {
        success: false,
        message: `Maximum available stock for "${item.name}" is ${item.stock}.`,
      };
    }

    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
    return { success: true };
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear cart storage:', e);
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
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
