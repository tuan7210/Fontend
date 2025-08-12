import { Order, CartItem } from '../types';
import { stockManager } from '../utils/stockManager';

// API URL configuration
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5032';

export const mockOrders: Order[] = [
  {
    id: '1',
  userId: 'tuan@example.com',
    items: [
      {
        id: '1',
        product: {
          id: '1',
          name: 'MacBook Pro 16-inch M3',
          price: 24990000,
          image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'Laptop',
          brand: 'Apple',
          description: 'The most powerful MacBook Pro ever',
          specifications: {},
          stock: 15,
          rating: 4.8,
          reviews: 324,
        },
        quantity: 1,
      },
    ],
    total: 24990000,
    status: 'delivered',
    shippingAddress: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'user@example.com',
      phone: '0123456789',
      address: '12 Nguyen Trai',
      city: 'Hà Nội',
      zipCode: '100000',
    },
    createdAt: '2025-08-01T10:30:00Z',
    updatedAt: '2025-08-02T14:45:00Z',
  },
  {
    id: '2',
  userId: 'tuan@example.com',
    items: [
      {
        id: '2',
        product: {
          id: '2',
          name: 'iPhone 15 Pro Max',
          price: 31990000,
          image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'Phone',
          brand: 'Apple',
          description: 'The ultimate iPhone',
          specifications: {},
          stock: 8,
          rating: 4.9,
          reviews: 567,
        },
        quantity: 1,
      },
    ],
    total: 31990000,
    status: 'processing',
    shippingAddress: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'user@example.com',
      phone: '0123456789',
      address: '12 Nguyen Trai',
      city: 'Hà Nội',
      zipCode: '100000',
    },
    createdAt: '2025-08-05T09:15:00Z',
    updatedAt: '2025-08-05T09:15:00Z',
  },
  {
    id: '3',
  userId: 'tuan@example.com',
    items: [
      {
        id: '3',
        product: {
          id: '3',
          name: 'Samsung Galaxy Tab S9',
          price: 18990000,
          image: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'Tablet',
          brand: 'Samsung',
          description: 'Flagship Android tablet',
          specifications: {},
          stock: 20,
          rating: 4.7,
          reviews: 210,
        },
        quantity: 2,
      },
    ],
    total: 37980000,
    status: 'shipped',
    shippingAddress: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'user@example.com',
      phone: '0123456789',
      address: '12 Nguyen Trai',
      city: 'Hà Nội',
      zipCode: '100000',
    },
    createdAt: '2025-08-08T12:00:00Z',
    updatedAt: '2025-08-10T08:30:00Z',
  },
];

// Helper function for API calls
async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    const url = `${API_URL}${path}`;
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorMessage = `API request failed (Status: ${response.status})`;
      try {
        const errorData = await response.json();
        console.error('API Error:', { 
          url, 
          method: options.method, 
          status: response.status,
          response: errorData 
        });
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (e) {
        // Error parsing JSON, use status text
        console.error('API Error (non-JSON):', { 
          url, 
          method: options.method,
          status: response.status
        });
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
            console.error('Error response text:', text);
          }
        } catch (textError) {
          console.error('Failed to get error text:', textError);
        }
      }
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }
    
    // Check for no content
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: 'cod' | 'online';
}

export interface OrderResponse {
  id: string;
  status: Order['status'];
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  createdAt: string;
  message?: string;
}

// Hàm để lưu đơn hàng vào localStorage
const saveOrdersToStorage = (orders: Order[]) => {
  localStorage.setItem('orders', JSON.stringify(orders));
};

// Hàm để lấy đơn hàng từ localStorage
const getOrdersFromStorage = (): Order[] => {
  const savedOrders = localStorage.getItem('orders');
  if (savedOrders) {
    try {
      return JSON.parse(savedOrders);
    } catch (error) {
      console.error('Error parsing orders from localStorage:', error);
    }
  }
  return [];
};

// Kết hợp đơn hàng mặc định và đơn hàng được lưu trong localStorage
const getSavedOrders = (): Order[] => {
  const savedOrders = getOrdersFromStorage();
  if (savedOrders.length > 0) {
    return savedOrders;
  }
  return mockOrders;
};

export const orderService = {
  async getOrders() {
    try {
      const response = await http<Order[]>('/api/Order');
      // Cập nhật localStorage nếu API thành công
      saveOrdersToStorage(response);
      return response;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Fallback to localStorage or mock data
      return getSavedOrders();
    }
  },

  async getOrderById(id: string) {
    try {
      return await http<Order>(`/api/Order/${id}`);
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      // Fallback to localStorage or mock data
      const savedOrders = getSavedOrders();
      return savedOrders.find(o => o.id === id) || null;
    }
  },

  async getUserOrders(userId?: string) {
    try {
      // Nếu không có userId được cung cấp, lấy từ localStorage
      let userIdToUse = userId;
      if (!userIdToUse) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          userIdToUse = user.userId;
        }
      }
      
      if (!userIdToUse) {
        throw new Error('Không tìm thấy ID người dùng');
      }
      
      // Gọi API với ID người dùng cụ thể
      return await http<Order[]>(`/api/Order/customer/${userIdToUse}`);
    } catch (error) {
      console.error(`Failed to fetch user orders:`, error);
      // Fallback to localStorage or mock data
      const savedOrders = getSavedOrders();
      return savedOrders.filter(o => {
        // Nếu không có userId, trả về mảng rỗng
        if (!userId) return false;
        return o.userId === userId;
      });
    }
  },

  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    // Lấy thông tin chi tiết của các sản phẩm từ localStorage để cập nhật hàng tồn kho
    const cartItems: CartItem[] = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    
    try {
      // Real API call to create order and update stock
      const response = await http<OrderResponse>('/api/Order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      // Đơn hàng thành công - cập nhật số lượng tồn kho ở phía client
      if (response && response.id) {
        // Cập nhật số lượng hàng tồn kho ở local
        stockManager.updateLocalStock(cartItems);
        
        // Bắt đầu làm mới dữ liệu sản phẩm từ server để đồng bộ hóa
        setTimeout(() => {
          stockManager.refreshAllProducts().catch(err => 
            console.error('Error refreshing stock data:', err)
          );
        }, 1000);
        
        // Lưu đơn hàng mới vào localStorage
        this.saveNewOrder({
          id: response.id,
          userId: orderData.shippingAddress.email,
          items: cartItems,
          total: response.total || cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          status: 'pending',
          shippingAddress: orderData.shippingAddress,
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.createdAt || new Date().toISOString()
        });
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create order:', error);
      
      // Fallback: Tạo đơn hàng giả để ứng dụng có thể tiếp tục hoạt động
      const mockOrderId = 'local-' + Date.now();
      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const createdAt = new Date().toISOString();
      
      // Tạo đơn hàng cho local storage
      const newOrder: Order = {
        id: mockOrderId,
        userId: orderData.shippingAddress.email,
        items: cartItems,
        total: total,
        status: 'pending',
        shippingAddress: orderData.shippingAddress,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      
      // Lưu đơn hàng mới vào localStorage
      this.saveNewOrder(newOrder);
      
      // Tạo response để trả về cho người gọi
      const mockOrderResponse: OrderResponse = {
        id: mockOrderId,
        status: 'pending',
        total: total,
        items: orderData.items.map(item => {
          const matchingItem = cartItems.find(i => i.product.id === item.productId);
          const price = matchingItem ? matchingItem.product.price : 0;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: price,
            subtotal: price * item.quantity
          };
        }),
        createdAt: createdAt,
        message: 'Đơn hàng được tạo trong chế độ ngoại tuyến. Bạn có thể theo dõi trạng thái đơn hàng trong mục quản lý đơn hàng.'
      };
      
      // Ngay cả trong trường hợp thất bại, chúng ta vẫn cập nhật số lượng hàng tồn kho ở phía client
      stockManager.updateLocalStock(cartItems);
      
      console.warn('Using mock order due to API failure');
      return mockOrderResponse;
    }
  },
  
  // Phương thức bổ sung để lưu đơn hàng mới vào localStorage
  saveNewOrder(order: Order) {
    const savedOrders = getSavedOrders();
    savedOrders.unshift(order); // Thêm đơn hàng mới vào đầu danh sách
    saveOrdersToStorage(savedOrders);
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    try {
      const response = await http<Order>(`/api/Order/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      // Cập nhật localStorage nếu API thành công
      const savedOrders = getSavedOrders();
      const updatedOrders = savedOrders.map(order => 
        order.id === id ? {...order, status, updatedAt: new Date().toISOString()} : order
      );
      saveOrdersToStorage(updatedOrders);
      
      return response;
    } catch (error) {
      console.error(`Failed to update order status:`, error);
      
      // Fallback: Cập nhật trạng thái trong localStorage
      const savedOrders = getSavedOrders();
      const orderIndex = savedOrders.findIndex(o => o.id === id);
      
      if (orderIndex !== -1) {
        savedOrders[orderIndex] = {
          ...savedOrders[orderIndex],
          status,
          updatedAt: new Date().toISOString(),
        };
        saveOrdersToStorage(savedOrders);
        return savedOrders[orderIndex];
      }
      return null;
    }
  },
  
  // Function to check stock levels before checkout
  async checkStockLevels(items: CartItem[]): Promise<boolean> {
    try {
      // Làm mới số lượng tồn kho trước khi kiểm tra (có thể có thay đổi từ đơn hàng khác)
      await Promise.all(items.map(async (item) => {
        const updatedStock = await stockManager.getStock(item.product.id, true);
        if (updatedStock >= 0) {
          item.product.stock = updatedStock;
        }
      }));
      
      // Đường dẫn API phù hợp với backend của bạn
      const response = await http<{valid: boolean, message?: string}>('/api/Product/check-stock', {
        method: 'POST',
        body: JSON.stringify({ 
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        }),
      });
      
      // Cập nhật thông tin hàng tồn kho vào cache local
      if (!response.valid && response.message) {
        throw new Error(response.message);
      }
      
      return response.valid;
    } catch (error) {
      console.error('Failed to check stock levels:', error);
      
      // Fallback: Kiểm tra tồn kho dựa trên dữ liệu phía client
      const insufficientItems: string[] = [];
      
      items.forEach(item => {
        if (item.quantity > item.product.stock) {
          insufficientItems.push(`${item.product.name} (còn ${item.product.stock}, cần ${item.quantity})`);
        }
      });
      
      if (insufficientItems.length > 0) {
        throw new Error(`Không đủ hàng tồn kho cho: ${insufficientItems.join(', ')}`);
      }
      
      // Nếu không có sản phẩm nào vượt quá tồn kho, cho phép tiếp tục
      return true;
    }
  }
};