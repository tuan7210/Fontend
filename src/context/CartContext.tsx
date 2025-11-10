import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { useAuth } from './AuthContext';
import * as cartService from '../services/cartService';
import { productService } from '../services/productService';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart từ backend khi user login/logout
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) { setItems([]); return; }
      try {
        const res = await cartService.getMyCart();
        const rawItems = res?.data?.items || res?.items || [];
        if (Array.isArray(rawItems)) {
          const detailed: CartItem[] = await Promise.all(rawItems.map(async (it: any) => {
            const pid = String(it.productId);
            const product = await productService.getProductById(pid);
            const fallback: Product = product || {
              id: pid,
              name: it.productName || 'Sản phẩm',
              price: Number(it.price ?? 0),
              image: it.imageUrl ? `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5032'}/api/Product/image/${it.imageUrl}` : '',
              category: '',
              brand: it.brand || '',
              description: '',
              specifications: {},
              stock: Number(it.stockQuantity ?? 0),
              rating: 0,
              reviews: 0
            };
            return {
              id: String(it.cartItemId || it.id || pid),
              product: fallback,
              quantity: Number(it.quantity || 1)
            };
          }));
          setItems(detailed);
        } else {
          setItems([]);
        }
      } catch (e) {
        setItems([]);
      }
    };
    fetchCart();
  }, [user]);

  // Thêm hoặc cập nhật sản phẩm trong giỏ hàng (gọi API)
  const addItem = async (product: Product, quantity = 1) => {
    if (!user) return false;
    try {
      await cartService.addOrUpdateCartItem(Number(product.id), quantity);
      const res = await cartService.getMyCart();
      const rawItems = res?.data?.items || res?.items || [];
      if (Array.isArray(rawItems)) {
        const detailed: CartItem[] = await Promise.all(rawItems.map(async (it: any) => {
          const pid = String(it.productId);
          const prod = await productService.getProductById(pid);
          const fb: Product = prod || {
            id: pid,
            name: it.productName || 'Sản phẩm',
            price: Number(it.price ?? 0),
            image: it.imageUrl ? `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5032'}/api/Product/image/${it.imageUrl}` : '',
            category: '',
            brand: it.brand || '',
            description: '',
            specifications: {},
            stock: Number(it.stockQuantity ?? 0),
            rating: 0,
            reviews: 0
          };
          return { id: String(it.cartItemId || it.id || pid), product: fb, quantity: Number(it.quantity || 1) };
        }));
        setItems(detailed);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng (gọi API)
  const removeItem = async (productId: string) => {
    const existing = items.find(i => i.product.id === productId);
    if (!existing) return;
    try {
      await cartService.removeCartItem(Number(existing.id));
      const res = await cartService.getMyCart();
      const rawItems = res?.data?.items || res?.items || [];
      if (Array.isArray(rawItems)) {
        const detailed: CartItem[] = await Promise.all(rawItems.map(async (it: any) => {
          const pid = String(it.productId);
          const prod = await productService.getProductById(pid);
          const fb: Product = prod || {
            id: pid,
            name: it.productName || 'Sản phẩm',
            price: Number(it.price ?? 0),
            image: it.imageUrl ? `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5032'}/api/Product/image/${it.imageUrl}` : '',
            category: '',
            brand: it.brand || '',
            description: '',
            specifications: {},
            stock: Number(it.stockQuantity ?? 0),
            rating: 0,
            reviews: 0
          };
          return { id: String(it.cartItemId || it.id || pid), product: fb, quantity: Number(it.quantity || 1) };
        }));
        setItems(detailed);
      }
    } catch {}
  };

  // Cập nhật số lượng sản phẩm (gọi API)
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) { await removeItem(productId); return; }
    try {
      await cartService.addOrUpdateCartItem(Number(productId), quantity);
      const res = await cartService.getMyCart();
      const rawItems = res?.data?.items || res?.items || [];
      if (Array.isArray(rawItems)) {
        const detailed: CartItem[] = await Promise.all(rawItems.map(async (it: any) => {
          const pid = String(it.productId);
          const prod = await productService.getProductById(pid);
          const fb: Product = prod || {
            id: pid,
            name: it.productName || 'Sản phẩm',
            price: Number(it.price ?? 0),
            image: it.imageUrl ? `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5032'}/api/Product/image/${it.imageUrl}` : '',
            category: '',
            brand: it.brand || '',
            description: '',
            specifications: {},
            stock: Number(it.stockQuantity ?? 0),
            rating: 0,
            reviews: 0
          };
          return { id: String(it.cartItemId || it.id || pid), product: fb, quantity: Number(it.quantity || 1) };
        }));
        setItems(detailed);
      }
    } catch {}
  };

  // Xóa toàn bộ giỏ hàng (gọi API)
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setItems([]);
    } catch {
      setItems([]);
    }
  };

  // Xử lý sau khi đặt hàng thành công
  const handleOrderSuccess = async () => {
    await clearCart();
  };

  const getItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + ((item.product?.price || 0) * item.quantity), 0);
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    handleOrderSuccess,
    getItemsCount,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};