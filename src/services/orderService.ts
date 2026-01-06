// ...removed misplaced duplicate updateOrderStatusV2...
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
import { Order, ApiResponse, PaginatedResponse } from '../types';
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




export const orderService = {
  // API mới: Admin cập nhật trạng thái đơn hàng
  async updateOrderStatusV2(id: number, status: string) {
    // Gọi API đúng chuẩn backend: PUT /api/Order/{id}/status với body { status }
    const response = await http<ApiResponse<any>>(`/api/Order/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!response.success) {
      throw new Error(response.message || 'Cập nhật trạng thái đơn hàng thất bại');
    }
    return response.data;
  },
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
      // Fallback: dùng mockOrders tối thiểu nếu cần hiển thị khi mất kết nối (không dùng localStorage)
      if (!userId) return [];
      return mockOrders.filter(o => o.userId === userId);
    }
  },

  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    // Không còn phụ thuộc localStorage cho checkout items; backend là nguồn sự thật
    
    try {
      // Chỉ cho phép tạo đơn trực tiếp với COD
      const pm = (orderData.paymentMethod || '').toLowerCase();
     
      // Tạo payload không có userId (backend sẽ tự lấy từ JWT token)
      const payload = {
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      
      
      // Real API call to create order and update stock (backend: POST /api/OrderTable)
      const response = await http<ApiResponse<OrderResponse>>('/api/OrderTable', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      
      // Không lưu đơn hàng vào localStorage nữa; backend là nguồn dữ liệu chính

      return response.data!;
    } catch (error) {
      // Fallback offline: ném lỗi để UI xử lý (có thể bổ sung mock nếu muốn hiển thị tạm)
      throw error;
    }
  },


  async updateOrderStatus(id: number, status: OrderResponse['status']) {
    const response = await http<ApiResponse<OrderResponse>>(`/api/OrderTable/${id}/${status}`, {
      method: 'PATCH',
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    return response;
  },

  async confirmPayment(orderId: number) {
    const response = await http<ApiResponse<any>>(`/api/Order/${orderId}/confirm-payment`, {
      method: 'PUT',
    });
    if (!response.success) {
      throw new Error(response.message || 'Xác nhận thanh toán thất bại');
    }
    return response.data;
  },

  // Kiểm tra tồn kho giỏ hàng trước khi thanh toán
  async checkCartStock(cartItems: Array<{ productId: number; quantity: number }>): Promise<{ success: boolean; message?: string; outOfStock?: Array<{ productId: number; productName: string; message: string }> }> {
    try {
      const raw = await http<any>('/api/Order/check-cart-stock', {
        method: 'POST',
        body: JSON.stringify(cartItems)
      });
      // Trường hợp backend dùng ApiResponse
      if (raw && typeof raw.success === 'boolean') {
        // Nếu có wrapper success/outOfStock trực tiếp
        return {
          success: raw.success,
          message: raw.message,
          outOfStock: raw.outOfStock || raw.data?.outOfStock || []
        };
      }
      // Trường hợp trả về { success, data: { outOfStock } }
      if (raw?.data && typeof raw.data.success === 'boolean') {
        return {
          success: raw.data.success,
          message: raw.data.message,
          outOfStock: raw.data.outOfStock || []
        };
      }
      // Fallback: coi như thất bại nếu không đúng format
      return { success: false, message: 'Phản hồi kiểm tra tồn kho không hợp lệ.' };
    } catch (e: any) {
      const msg = e?.message || 'Lỗi khi kiểm tra tồn kho';
      // Trả về dạng thất bại để UI hiển thị
      return { success: false, message: msg };
    }
  }
};