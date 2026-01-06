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

export async function getCustomers(params: GetCustomersParams = {}): Promise<any> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));

  let endpoint = '/api/Customer';
  if (params.search) {
    endpoint = '/api/Customer/search';
    q.set('keyword', params.search);
  }
  const query = q.toString();
  // Gọi API và trả về nguyên object response (data, pagination...)
  const resp = await http<any>(`${endpoint}${query ? `?${query}` : ''}`);
  return resp;
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
    
    // Phương pháp dự phòng: sử dụng userId từ localStorage
    const userId = user?.id;
    
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
    const userData = localStorage.getItem('user');
    let currentRole: 'customer' | 'admin' = 'customer';
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed?.role) currentRole = parsed.role;
      } catch {}
    }

    // Gọi API mới: PUT /api/auth/me
    const resp = await http<any>(`/api/auth/me`, {
      method: 'PUT',
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        address: input.address
      }),
    });

    // Hỗ trợ nhiều định dạng trả về: { user: {...} } hoặc trả trực tiếp
    const payload: any = resp as any;
    const dataObj: any = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
    const u = (dataObj && typeof dataObj === 'object' && 'user' in dataObj) ? dataObj.user : dataObj;

    const mapped: Customer = {
      userId: u?.userId ?? u?.UserId ?? 0,
      name: u?.name ?? u?.Name ?? '',
      email: u?.email ?? u?.Email ?? '',
      role: currentRole,
      phone: u?.phone ?? u?.Phone ?? '',
      address: u?.address ?? u?.Address ?? '',
      status: 'active',
      orderCount: 0,
      totalSpent: 0,
      recentOrders: [],
    };

    // Cập nhật thông tin user tối thiểu trong localStorage
    try {
      if (userData) {
        const prev = JSON.parse(userData);
        const updatedUser = {
          ...prev,
          name: mapped.name || prev.name,
          email: mapped.email || prev.email,
          phone: mapped.phone ?? prev.phone,
          address: mapped.address ?? prev.address,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch {}

    return mapped;
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

function mapApiCustomer(api: any): Customer {
  // Hỗ trợ cả trường hợp api là object gốc hoặc có lồng customer
  const customer = api.customer || api;
  // Lấy userId từ nhiều trường hợp khác nhau
  const userId = customer.userId ?? customer.id ?? customer.userID ?? api.userId ?? api.id ?? api.userID;
  return {
    userId: userId,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone ?? '',
    role: customer.role ?? api.role ?? 'customer',
    address: customer.address ?? '',
    status: customer.status || 'active',
    orderCount: customer.orderCount ?? api.orderCount ?? 0,
    totalSpent: customer.totalSpent ?? api.totalSpent ?? 0,
    recentOrders: customer.recentOrders ?? api.recentOrders ?? [],
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
