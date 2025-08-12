import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { useAuth } from './AuthContext';
import { stockManager } from '../utils/stockManager';

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

  // Helper to get cart key for current user
  const getCartKey = () => {
    return user?.email ? `cart_${user.email}` : 'cart_guest';
  };

  // Load cart when user changes (login/logout)
  useEffect(() => {
    const savedCart = localStorage.getItem(getCartKey());
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    } else {
      setItems([]);
    }
  }, [user]);

  // Save cart when items change
  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(items));
  }, [items, user]);

  const addItem = (product: Product, quantity = 1) => {
    if (!user) {
      // Không điều hướng ở đây, chỉ trả về false để component xử lý
      return false;
    }
    
    // Kiểm tra tồn kho trước khi thêm sản phẩm
    const existingItem = items.find(item => item.product.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;
    
    // Kiểm tra nếu vượt quá số lượng tồn kho
    if (newTotalQuantity > product.stock) {
      alert(`Chỉ còn ${product.stock} sản phẩm trong kho. Bạn đã có ${currentQuantity} trong giỏ hàng.`);
      return false;
    }
    
    // Cập nhật thông tin tồn kho trong cache local
    stockManager.getStock(product.id).then(updatedStock => {
      if (updatedStock >= 0 && updatedStock < newTotalQuantity) {
        alert(`Số lượng hàng tồn kho đã thay đổi. Chỉ còn ${updatedStock} sản phẩm.`);
        // Nếu cần, có thể cập nhật lại số lượng ở đây
      }
    }).catch(() => {
      // Tiếp tục ngay cả khi không thể kiểm tra tồn kho
    });
    
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...currentItems, { id: product.id, product, quantity }];
    });
    return true;
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    // Tìm sản phẩm trong giỏ hàng
    const item = items.find(item => item.product.id === productId);
    if (!item) return;
    
    // Kiểm tra tồn kho trước khi cập nhật số lượng
    if (quantity > item.product.stock) {
      alert(`Chỉ còn ${item.product.stock} sản phẩm trong kho.`);
      // Giới hạn số lượng không vượt quá tồn kho
      quantity = item.product.stock;
    }
    
    // Cập nhật thông tin tồn kho từ server
    stockManager.getStock(productId, true).then(updatedStock => {
      if (updatedStock >= 0 && updatedStock < quantity) {
        alert(`Số lượng hàng tồn kho đã thay đổi. Chỉ còn ${updatedStock} sản phẩm.`);
        
        // Cập nhật lại số lượng nếu tồn kho đã thay đổi
        setItems(currentItems =>
          currentItems.map(item => {
            if (item.product.id === productId) {
              return { 
                ...item, 
                quantity: Math.min(quantity, updatedStock),
                product: {
                  ...item.product,
                  stock: updatedStock
                }
              };
            }
            return item;
          })
        );
      }
    }).catch(() => {
      // Tiếp tục ngay cả khi không thể kiểm tra tồn kho
    });
    
    // Cập nhật số lượng trong giỏ hàng
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.setItem(getCartKey(), JSON.stringify([]));
  };

  const getItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemsCount,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};