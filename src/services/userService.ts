// Service for managing customers (users) for admin panel
import type { Customer } from '../types';

// Robust base URL resolution (typed, with fallback)
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5032';

type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  error?: string;
};

// Shape returned by backend for a customer
interface ApiCustomer {
  userId?: number;
  id?: number;
  userID?: number;
  name: string;
  email: string;
  phone?: string;
  role?: 'customer' | 'admin';
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  // Customer metrics from API docs
  orderCount?: number;
  totalSpent?: number;
  recentOrders?: Array<{
    orderId: number;
    orderDate: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
  }>;
}

async function http<T>(path: string, options: RequestInit = {}): Promise<Envelope<T>> {
  try {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    const url = `${API_URL}${path}`;
    
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let json: unknown = null;
    if (isJson) {
      json = await res.json().catch((error) => {
        return null;
      });
    }
    
    if (!res.ok) {
      let msg = res.statusText || 'Request failed';
      
      if (isJson && json && typeof json === 'object') {
        if ('message' in json) {
          const m = (json as { message?: string }).message;
          if (m) msg = m;
        } else if ('error' in json) {
          const e = (json as { error?: string }).error;
          if (e) msg = e;
        }
      } else if (!isJson) {
        const text = await res.text().catch(() => '');
        if (text) {
          msg = text;
        }
      }
      
      throw new Error(`${msg} (Status: ${res.status})`);
    }
    
    if (res.status === 204) {
      // No Content
      return { success: true } as Envelope<T>;
    }
    
    // Assume JSON envelope on success
    return (json as Envelope<T>) ?? ({ success: true } as Envelope<T>);
  } catch (error) {
    throw error;
  }
}

export interface GetCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PagedCustomers {
  items: Customer[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export async function getCustomers(params: GetCustomersParams = {}): Promise<PagedCustomers> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  
  let endpoint = '/api/Customer';
  
  // Nếu có search, sử dụng endpoint search với tham số keyword
  if (params.search) {
    endpoint = '/api/Customer/search';
    q.set('keyword', params.search);
  }
  
  const query = q.toString();
  const resp = await http<ApiCustomer[]>(`${endpoint}${query ? `?${query}` : ''}`);
  const apiItems = Array.isArray(resp.data) ? resp.data : [];
  const items = apiItems.map(mapApiCustomer);
  return {
    items,
    page: resp.pagination?.page ?? params.page ?? 1,
    pageSize: resp.pagination?.pageSize ?? params.pageSize ?? 10,
    totalCount: resp.pagination?.totalCount ?? items.length,
    totalPages: resp.pagination?.totalPages ?? 1,
  };
}

export async function getCustomerById(id: number | string): Promise<Customer> {
  const resp = await http<ApiCustomer>(`/api/Customer/${id}`);
  if (!resp.data) throw new Error(resp.message || 'Không tìm thấy khách hàng');
  return mapApiCustomer(resp.data as ApiCustomer);
}

// Get current authenticated customer
export async function getCurrentCustomer(): Promise<Customer> {
  try {
    // Đầu tiên, kiểm tra xem người dùng đã đăng nhập chưa
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userInfo = localStorage.getItem('userInfo');
    
    if (!token || !userInfo) {
      throw new Error('Người dùng chưa đăng nhập');
    }
    
    // Parse thông tin user từ localStorage
    let user;
    try {
      user = JSON.parse(userInfo);
    } catch (e) {
      throw new Error('Dữ liệu người dùng không hợp lệ');
    }
    
    // Thử gọi API endpoint /api/Customer/me trước
    try {
      const resp = await http<ApiCustomer>(`/api/Customer/${user.id}`);
      if (resp.data) {
        return mapApiCustomer(resp.data as ApiCustomer);
      }
    } catch (meApiError) {
      // Tiếp tục thử phương pháp khác nếu endpoint này thất bại
    }
    
    // Phương pháp dự phòng: sử dụng userId từ localStorage
    const userId = user?.userId;
    
    if (userId) {
      // Nếu có userId, lấy thông tin chi tiết của user từ API
      try {
        const resp = await http<ApiCustomer>(`/api/Customer/${userId}`);
        if (resp.data) {
          return mapApiCustomer(resp.data as ApiCustomer);
        }
      } catch (error) {
        // Tiếp tục với fallback
      }
    }
    
    // Fallback: tạo customer từ thông tin có sẵn trong localStorage
    return {
      userId: user.userId || 0,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'customer',
      address: user.address || '',
      // Default empty metrics
      orderCount: 0,
      totalSpent: 0,
      recentOrders: [],
    };
  } catch (error) {
    
    // Nếu tất cả đều thất bại, tạo user mặc định để tránh lỗi UI
    return {
      userId: 0,
      name: 'Khách',
      email: '',
      phone: '',
      role: 'customer',
      address: '',
      status: 'active',
      orderCount: 0,
      totalSpent: 0,
      recentOrders: [],
    };
  }
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'locked';
}

export async function updateCustomer(id: number | string, input: UpdateCustomerInput): Promise<Customer> {
  const resp = await http<ApiCustomer>(`/api/Customer/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!resp.success) throw new Error(resp.message || 'Cập nhật thất bại');
  if (!resp.data) throw new Error(resp.message || 'Cập nhật thất bại');
  return mapApiCustomer(resp.data as ApiCustomer);
}

export async function updateCurrentCustomer(input: UpdateCustomerInput): Promise<Customer> {
  try {
    // Lấy userId từ localStorage - cần phải có userId để update
    const userData = localStorage.getItem('user');
    let userId = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.userId;
      } catch (e) {
      }
    }
    
    if (!userId) {
      throw new Error('Không tìm thấy thông tin người dùng hiện tại');
    }
    
    // Sử dụng userId để cập nhật thông tin user
    const resp = await http<ApiCustomer>(`/api/Customer/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address
      }),
    });
    
    if (!resp.success) throw new Error(resp.message || 'Cập nhật thất bại');
    if (!resp.data) throw new Error(resp.message || 'Cập nhật thất bại');
    
    // Cập nhật thông tin user trong localStorage
    try {
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = {
          ...user,
          name: input.name || user.name,
          email: input.email || user.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (e) {
    }
    
    return mapApiCustomer(resp.data as ApiCustomer);
  } catch (error) {
    throw error;
  }
}

export async function deleteCustomer(id: number | string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/Customer/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data: { message?: string; error?: string } = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(msg || 'Xoá khách hàng thất bại');
  }
}

function mapApiCustomer(api: ApiCustomer): Customer {
  return {
    userId: api.userId ?? api.id ?? api.userID ?? 0,
    name: api.name,
    email: api.email,
    phone: api.phone ?? '',
    role: api.role ?? 'customer',
    address: api.address ?? '',
    createdAt: api.createdAt ?? undefined,
    updatedAt: api.updatedAt ?? undefined,
    // Mặc định trạng thái là active nếu không có
    status: (api as any).status || 'active',
    // Map customer metrics from API response
    orderCount: api.orderCount ?? 0,
    totalSpent: api.totalSpent ?? 0,
    recentOrders: api.recentOrders ?? [],
  };
}

// Hàm khóa tài khoản khách hàng
export async function lockCustomerAccount(id: number | string): Promise<Customer> {
  const resp = await http<ApiCustomer>(`/api/Customer/${id}/lock`, {
    method: 'PUT'
  });
  if (!resp.success) throw new Error(resp.message || 'Khóa tài khoản thất bại');
  if (!resp.data) throw new Error(resp.message || 'Khóa tài khoản thất bại');
  return mapApiCustomer(resp.data as ApiCustomer);
}

// Hàm mở khóa tài khoản khách hàng
export async function unlockCustomerAccount(id: number | string): Promise<Customer> {
  const resp = await http<ApiCustomer>(`/api/Customer/${id}/unlock`, {
    method: 'PUT'
  });
  if (!resp.success) throw new Error(resp.message || 'Mở khóa tài khoản thất bại');
  if (!resp.data) throw new Error(resp.message || 'Mở khóa tài khoản thất bại');
  return mapApiCustomer(resp.data as ApiCustomer);
}

export default {
  getCustomers,
  getCustomerById,
  getCurrentCustomer,
  updateCustomer,
  updateCurrentCustomer,
  deleteCustomer,
  lockCustomerAccount,
  unlockCustomerAccount
};
