'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { Cart, CartItem, SelectedOption } from './types';
import { useAuth } from './auth';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  addItem: (productId: string, quantity?: number, selectedOptions?: SelectedOption[]) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = async () => {
    try {
      const data = await api.get<Cart>('/cart');
      setCart(data);
    } catch {
      setCart(null);
    }
  };

  // /auth/me와 병렬로 장바구니 선제 로딩 (토큰 존재 시)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) refresh();
  }, []);

  // 로그아웃 시 장바구니 초기화
  useEffect(() => {
    if (!loading && !user) setCart(null);
  }, [loading, user]);

  const addItem = async (productId: string, quantity = 1, selectedOptions?: SelectedOption[]) => {
    await api.post('/cart/items', { productId, quantity, selectedOptions });
    await refresh();
  };

  const updateItem = async (itemId: string, quantity: number) => {
    await api.patch(`/cart/items/${itemId}`, { quantity });
    await refresh();
  };

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/items/${itemId}`);
    await refresh();
  };

  const clearCart = () => setCart(null);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, addItem, updateItem, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
