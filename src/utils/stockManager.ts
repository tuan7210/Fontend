import { productService } from '../services/productService';
import { CartItem } from '../types';

/**
 * Stock Manager - Quản lý đồng bộ tồn kho real-time giữa các trang
 */
export const stockManager = {
  // Cache sản phẩm đã được cập nhật
  updatedProducts: new Map<string, number>(),
  
  // Danh sách subscribers để thông báo khi stock thay đổi
  subscribers: new Set<(productId: string, newStock: number) => void>(),
  
  // Thời gian cập nhật cuối cùng cho mỗi sản phẩm
  lastUpdate: new Map<string, number>(),

  /**
   * Đăng ký listener để nhận thông báo khi stock thay đổi
   */
  subscribe(callback: (productId: string, newStock: number) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  },

  /**
   * Thông báo cho tất cả subscribers khi stock thay đổi
   */
  notifySubscribers(productId: string, newStock: number): void {
    this.subscribers.forEach(callback => {
      try {
        callback(productId, newStock);
      } catch (error) {
        console.error('Error in stock subscriber:', error);
      }
    });
  },

  /**
   * Lấy stock đã được cache cho một sản phẩm
   */
  getCachedStock(productId: string): number | null {
    return this.updatedProducts.get(productId) || null;
  },

  /**
   * Cập nhật stock và thông báo cho subscribers
   */
  updateStockAndNotify(productId: string, newStock: number): void {
    const oldStock = this.updatedProducts.get(productId);
    
    this.updatedProducts.set(productId, newStock);
    this.lastUpdate.set(productId, Date.now());

    // Chỉ notify nếu stock thực sự thay đổi
    if (oldStock !== newStock) {
      this.notifySubscribers(productId, newStock);
    }
  },

  /**
   * Đồng bộ stock với server và thông báo
   */
  async syncWithServer(productId: string): Promise<number | null> {
    try {
      const product = await productService.getProductById(productId);
      if (product) {
        const currentStock = product.stock;
        this.updateStockAndNotify(productId, currentStock);
        return currentStock;
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
    return null;
  },

  /**
   * Giảm stock sau khi đặt hàng thành công
   */
  async decrementStockAfterOrder(cartItems: CartItem[]): Promise<void> {
    for (const item of cartItems) {
      const productId = item.product.id;
      let currentStock = this.getCachedStock(productId);
      
      // Nếu không có cache, sử dụng stock từ product
      if (currentStock === null) {
        currentStock = item.product.stock;
      }
      
      const newStock = Math.max(0, currentStock - item.quantity);
      
      // Cập nhật local stock và notify ngay lập tức
      this.updateStockAndNotify(productId, newStock);
      
      // Lưu vào localStorage để persist data
      try {
        const localUpdates = JSON.parse(localStorage.getItem('stockUpdates') || '{}');
        localUpdates[productId] = {
          stock: newStock,
          timestamp: Date.now()
        };
        localStorage.setItem('stockUpdates', JSON.stringify(localUpdates));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      // Cập nhật product stock trong memory để các component khác có thể sử dụng
      item.product.stock = newStock;
    }
    
    // Đồng bộ với server sau khi cập nhật tất cả local stocks
    setTimeout(async () => {
      for (const item of cartItems) {
        try {
          await this.syncWithServer(item.product.id);
        } catch (error) {
          console.error(`Error syncing ${item.product.id} with server:`, error);
        }
      }
    }, 500);
  },

  /**
   * Khôi phục stock từ localStorage khi khởi động
   */
  restoreFromLocalStorage(): void {
    try {
      const localUpdates = JSON.parse(localStorage.getItem('stockUpdates') || '{}');
      const now = Date.now();
      
      Object.entries(localUpdates).forEach(([productId, data]: [string, any]) => {
        // Chỉ khôi phục nếu dữ liệu không quá cũ (dưới 1 giờ)
        if (data.timestamp && (now - data.timestamp) < 3600000) {
          this.updatedProducts.set(productId, data.stock);
          this.lastUpdate.set(productId, data.timestamp);
        }
      });
    } catch (error) {
      console.error('Error restoring from localStorage:', error);
    }
  },

  /**
   * Xóa cache cũ
   */
  cleanOldCache(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 giờ
    
    for (const [productId, timestamp] of this.lastUpdate.entries()) {
      if (now - timestamp > maxAge) {
        this.updatedProducts.delete(productId);
        this.lastUpdate.delete(productId);
      }
    }
  },

  /**
   * Xóa cache
   */
  clearCache(): void {
    this.updatedProducts.clear();
    this.lastUpdate.clear();
    localStorage.removeItem('stockUpdates');
  },

  /**
   * Khởi tạo stock manager
   */
  init(): void {
    this.restoreFromLocalStorage();
    this.cleanOldCache();
    
    // Dọn dẹp cache mỗi 5 phút
    setInterval(() => {
      this.cleanOldCache();
    }, 300000);
  },

  /**
   * Debug function - kiểm tra trạng thái hiện tại
   */
  debug(): void {
    console.log('=== StockManager Debug ===');
    console.log('Subscribers count:', this.subscribers.size);
    console.log('Updated products:', Array.from(this.updatedProducts.entries()));
    console.log('Last updates:', Array.from(this.lastUpdate.entries()));
    console.log('localStorage stockUpdates:', localStorage.getItem('stockUpdates'));
    console.log('=========================');
  }
};

// Khởi tạo khi module được load
stockManager.init();
