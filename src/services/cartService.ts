import axios from 'axios';

// Use API base URL from env (fallback to local backend)
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5032';

// Axios instance with baseURL and auth header
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy giỏ hàng của user hiện tại
export const getMyCart = async () => {
  const res = await api.get('/api/Cart/my');
  return res.data;
};

// Thêm hoặc cập nhật sản phẩm trong giỏ hàng
export const addOrUpdateCartItem = async (productId: number, quantity: number) => {
  const res = await api.post('/api/Cart/add', { productId, quantity });
  return res.data;
};

// Xóa một sản phẩm khỏi giỏ hàng
export const removeCartItem = async (cartItemId: number) => {
  const res = await api.delete(`/api/Cart/item/${cartItemId}`);
  return res.data;
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async () => {
  const res = await api.delete('/api/Cart/clear');
  return res.data;
};