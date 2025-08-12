import { productService } from '../services/productService';
import { CartItem } from '../types';

/**
 * Hàm tiện ích để cập nhật lại số lượng hàng tồn kho ở phía client
 * sau khi đặt hàng thành công
 */
export const stockManager = {
  // Lưu cache các sản phẩm đã được cập nhật
  updatedProducts: new Map<string, number>(),
  
  /**
   * Cập nhật số lượng hàng tồn kho trong bộ nhớ cache local
   * @param items Các mặt hàng đã đặt
   */
  updateLocalStock(items: CartItem[]) {
    const updatePromises: Promise<void>[] = [];
    
    items.forEach(item => {
      const productId = item.product.id;
      const currentStock = item.product.stock;
      const quantity = item.quantity;
      
      // Cập nhật số lượng tồn kho
      const newStock = Math.max(0, currentStock - quantity);
      this.updatedProducts.set(productId, newStock);
      
      // Cập nhật số lượng tồn kho trong LocalStorage nếu cần
      try {
        // Cập nhật sản phẩm trong localStorage nếu có
        const cartItems = localStorage.getItem('cart-items');
        if (cartItems) {
          const items = JSON.parse(cartItems);
          const updatedItems = items.map((cartItem: any) => {
            if (cartItem.product?.id === productId) {
              return {
                ...cartItem,
                product: {
                  ...cartItem.product,
                  stock: newStock
                }
              };
            }
            return cartItem;
          });
          localStorage.setItem('cart-items', JSON.stringify(updatedItems));
        }
        
        // Thêm vào danh sách promise để cập nhật stock trong API
        updatePromises.push(
          (async () => {
            try {
              const product = await productService.getProductById(productId);
              if (product && product.stock !== newStock) {
                // Cập nhật số lượng tồn kho trong API
                await productService.updateProduct(productId, { stock: newStock });
                console.log(`Đã cập nhật tồn kho cho sản phẩm ${productId}: ${newStock}`);
              }
            } catch (error) {
              console.error(`Không thể cập nhật tồn kho cho sản phẩm ${productId}:`, error);
            }
          })()
        );
      } catch (error) {
        console.error('Error updating cart items in localStorage:', error);
      }
    });
    
    // Thực thi tất cả các promise cập nhật
    Promise.all(updatePromises).catch(error => {
      console.error('Error while updating stock in API:', error);
    });
  },
  
  /**
   * Đồng bộ hóa số lượng tồn kho với server
   * @param productId ID của sản phẩm cần làm mới
   * @returns Số lượng tồn kho mới
   */
  async refreshProductStock(productId: string): Promise<number> {
    try {
      const product = await productService.getProductById(productId);
      if (product) {
        this.updatedProducts.set(productId, product.stock);
        return product.stock;
      }
      return -1;
    } catch (error) {
      console.error(`Failed to refresh stock for product ${productId}:`, error);
      return -1;
    }
  },
  
  /**
   * Lấy số lượng tồn kho hiện tại của sản phẩm
   * Ưu tiên dữ liệu từ cache local, sau đó mới gọi API nếu cần
   * @param productId ID của sản phẩm
   * @param forceRefresh Có bắt buộc làm mới từ server không
   */
  async getStock(productId: string, forceRefresh = false): Promise<number> {
    if (forceRefresh || !this.updatedProducts.has(productId)) {
      return this.refreshProductStock(productId);
    }
    return this.updatedProducts.get(productId) ?? -1;
  },
  
  /**
   * Làm mới toàn bộ dữ liệu sản phẩm sau khi đặt hàng
   */
  async refreshAllProducts(): Promise<void> {
    try {
      // Lấy danh sách sản phẩm cần làm mới
      const productIds = Array.from(this.updatedProducts.keys());
      
      // Làm mới từng sản phẩm một
      for (const productId of productIds) {
        await this.refreshProductStock(productId);
      }
    } catch (error) {
      console.error('Failed to refresh all products:', error);
    }
  },
  
  /**
   * Xóa tất cả dữ liệu cache
   */
  clearCache(): void {
    this.updatedProducts.clear();
  }
};
