// Lấy danh sách đơn hàng có phân trang
export interface GetOrdersPagedParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface OrdersPagedResponse {
  data: OrderResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
import { Order, CartItem, ApiResponse, PaginatedResponse } from '../types';
import type { OrderResponse } from '../types';

// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5032';

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
export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = localStorage.getItem('token');
    
    // Debug: Log token info
    if (token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp && tokenPayload.exp < now) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Token expired, please login again');
        } else {
        }
      } catch (e) {
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
    }
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      // Temporarily disable auth for testing - uncomment next line to enable
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    const url = `${API_URL}${path}`;
    
    // Debug: Log request body if present
    if (options.body) {
    }
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorMessage = `API request failed (Status: ${response.status})`;
      try {
        const errorData = await response.json();        
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (e) {
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
            
          }
        } catch (textError) {
          
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
    
    throw error;
  }
}

export interface CreateOrderRequest {
  // userId được backend tự động lấy từ JWT token
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress: string;
  paymentMethod: string;
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
  async getOrdersPaged(params: GetOrdersPagedParams) {
    const { page = 1, pageSize = 10, search = '' } = params || {};
    let url = `/api/Order?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await http<any>(url);
    return {
      data: response.data || [],
      pagination: response.pagination || {
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1
      }
    };
  },
  async getOrders(searchText?: string) {
    var url = '/api/OrderTable';
    if (searchText) url += `?searchText=${searchText}`
    const response = await http<ApiResponse<PaginatedResponse<OrderResponse>>>(url);
      if (response.success){
        return response.data?.items;
      }
      return [];
  },

  async getOrderById(id: string | number): Promise<OrderResponse> {
    const url = `/api/OrderTable/${id}`;
    const response  = await http<ApiResponse<OrderResponse>>(url);
    if (response.success) {
      return response.data as OrderResponse;
    }
    throw new Error(response.message);
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
      return await http<Order[]>(`/api/OrderTable/customer/${userIdToUse}`);
    } catch (error) {
      
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
      // Tạo payload không có userId (backend sẽ tự lấy từ JWT token)
      const payload = {
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      
      
      // Real API call to create order and update stock
      const response = await http<OrderResponse>('/api/Order', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      
      // Đơn hàng thành công - cập nhật số lượng tồn kho ở phía client
      if (response && response.orderId) {
        // Lấy userId từ localStorage để lưu đơn hàng
        let username = '';
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            username = user.name || user.email || '';
          } catch (e) {}
        }
        // Lưu đơn hàng mới vào localStorage (as Order, not OrderResponse)
        this.saveNewOrder({
          id: response.orderId.toString(),
          userId: username,
          items: cartItems,
          total: response.totalAmount || cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          status: response.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
          shippingAddress: {
            firstName: 'N/A',
            lastName: 'N/A',
            email: username,
            phone: 'N/A',
            address: orderData.shippingAddress,
            city: 'N/A',
            zipCode: 'N/A'
          },
          createdAt: response.orderDate ? new Date(response.orderDate).toISOString() : new Date().toISOString(),
          updatedAt: response.orderDate ? new Date(response.orderDate).toISOString() : new Date().toISOString()
        });
      }
      
      return response;
    } catch (error) {
      
      
      // Fallback: Tạo đơn hàng giả để ứng dụng có thể tiếp tục hoạt động
      const mockOrderId = 'local-' + Date.now();
      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const createdAt = new Date().toISOString();
      
      // Lấy userId từ localStorage
      let userId = '1'; // fallback
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.userId?.toString() || user.email || '1';
        } catch (e) {
          
        }
      }
      
      // Tạo shippingAddress object từ string để lưu vào localStorage
      const shippingAddressObj = {
        firstName: 'N/A',
        lastName: 'N/A', 
        email: cartItems.length > 0 ? cartItems[0].product.brand : '',
        phone: 'N/A',
        address: orderData.shippingAddress,
        city: 'N/A',
        zipCode: 'N/A'
      };
      
      // Tạo đơn hàng cho local storage
      const newOrder: Order = {
        id: mockOrderId,
        userId: userId,
        items: cartItems,
        total: total,
        status: 'pending',
        shippingAddress: shippingAddressObj,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      
      // Lưu đơn hàng mới vào localStorage
      this.saveNewOrder(newOrder);
      
      // Tạo response để trả về cho người gọi (OrderResponse)
      const mockOrderResponse: OrderResponse = {
        orderId: Number(mockOrderId),
        userId: 1,
        username: 'Offline User',
        orderDate: new Date(createdAt),
        status: 'pending',
        totalAmount: total,
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
        shippingAddress: orderData.shippingAddress,
        items: orderData.items.map((item, idx) => {
          const matchingItem = cartItems.find(i => parseInt(i.product.id) === item.productId);
          const price = matchingItem ? matchingItem.product.price : 0;
          return {
            orderItemId: idx + 1,
            productId: item.productId,
            productName: matchingItem ? matchingItem.product.name : '',
            imageUrl: matchingItem ? matchingItem.product.image : '',
            quantity: item.quantity,
            price: price,
            subtotal: price * item.quantity
          };
        }),
        email: '',
        phone: ''
      };
      return mockOrderResponse;
    }
  },
  
  // Phương thức bổ sung để lưu đơn hàng mới vào localStorage
  saveNewOrder(order: Order) {
    const savedOrders = getSavedOrders();
    savedOrders.unshift(order); // Thêm đơn hàng mới vào đầu danh sách
    saveOrdersToStorage(savedOrders);
  },

  async updateOrderStatus(id: number, status: OrderResponse['status']) {
    const response = await http<ApiResponse<OrderResponse>>(`/api/OrderTable/${id}/${status}`, {
      method: 'PATCH',
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  },

  async confirmPayment(orderId: number) {
    const response = await http<ApiResponse<any>>(`/api/Order/${orderId}/confirm-payment`, {
      method: 'PUT',
    });
    if (!response.success) {
      throw new Error(response.message || 'Xác nhận thanh toán thất bại');
    }
    return response.data;
  }
};