export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  description: string;
  specifications: Record<string, string>;
  stock: number;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface User {
  email: string;
  role: 'customer' | 'admin';
  name?: string;
  userId?: number;
}

// Customer model for Admin management (richer than minimal User used in auth context)
export interface Customer {
  userId: number; // backend uses numeric IDs
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'locked'; // Trạng thái tài khoản: active (hoạt động) hoặc locked (bị khóa)
  // Customer metrics
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

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CartContextType {
  items: CartItem[];
  // Returns true if item was added; false if action requires auth (caller can handle navigation)
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  handleOrderSuccess: (orderItems: CartItem[]) => Promise<void>;
  getItemsCount: () => number;
  getTotalPrice: () => number;
}