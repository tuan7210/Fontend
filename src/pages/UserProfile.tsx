import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ProfileMetrics from '../components/UI/ProfileMetrics';
import RefreshButton from '../components/UI/RefreshButton';
import { getCurrentCustomer, updateCurrentCustomer } from '../services/userService';
import { Link } from 'react-router-dom';

type Profile = {
  userId: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
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
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
};


const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user) {
        setLoading(false);
        setError('Vui lòng đăng nhập để xem thông tin tài khoản');
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        // Trước tiên thử tạo profile từ thông tin đã lưu trong localStorage
        let prof: Profile | null = null;
        const userData = localStorage.getItem('user');
        
        if (userData) {
          try {
            const userJson = JSON.parse(userData);
            // Khởi tạo profile cơ bản từ localStorage
            prof = {
              userId: userJson.userId || 0,
              name: userJson.name || '',
              email: userJson.email || '',
              role: userJson.role || 'customer',
              phone: '',
              address: '',
              // Khởi tạo giá trị mặc định cho metrics
              orderCount: 0,
              totalSpent: 0,
              recentOrders: [],
            };
          } catch (parseError) {
            console.error('Error parsing user data from localStorage:', parseError);
          }
        }
        
        try {
          // Sau đó thử lấy thông tin chi tiết từ API
          const me = await getCurrentCustomer();
          prof = {
            userId: me.userId,
            name: me.name,
            email: me.email,
            role: me.role,
            phone: me.phone || '',
            address: me.address || '',
            createdAt: me.createdAt,
            updatedAt: me.updatedAt,
            // Map customer metrics 
            orderCount: me.orderCount,
            totalSpent: me.totalSpent,
            recentOrders: me.recentOrders,
          };
        } catch (apiError) {
          console.warn('Could not fetch customer details from API:', apiError);
          // Nếu không lấy được từ API nhưng đã có thông tin cơ bản, vẫn tiếp tục
          if (!prof) {
            throw apiError; // Rethrow nếu không có thông tin cơ bản
          }
        }
        
        if (!ignore && prof) {
          setProfile(prof);
          setForm({ name: prof.name || '', email: prof.email || '', phone: prof.phone || '', address: prof.address || '' });
        }
      } catch (e: unknown) {
        if (!ignore) {
          console.error('Error in UserProfile:', e);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    try {
      const updated = await updateCurrentCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setProfile({
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
        address: updated.address,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        // Preserve metrics data from previous profile state
        orderCount: profile.orderCount,
        totalSpent: profile.totalSpent,
        recentOrders: profile.recentOrders,
      });
      // Sync localStorage user for header display, etc.
      const current = localStorage.getItem('user');
      if (current) {
        try {
          const parsed = JSON.parse(current);
          localStorage.setItem('user', JSON.stringify({ ...parsed, name: updated.name, email: updated.email }));
        } catch {
          // ignore
        }
      }
      
      // Reload customer data to refresh metrics
      try {
        const refreshed = await getCurrentCustomer();
        if (refreshed) {
          setProfile({
            ...updated,
            orderCount: refreshed.orderCount,
            totalSpent: refreshed.totalSpent,
            recentOrders: refreshed.recentOrders,
          });
        }
      } catch (refreshError) {
        // Silent fail - we still updated the profile successfully
        console.error('Could not refresh metrics:', refreshError);
      }
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl font-medium text-gray-700">Bạn cần đăng nhập để xem thông tin tài khoản</div>
        <div className="mt-4">
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl font-medium text-gray-700">Không tìm thấy thông tin tài khoản</div>
        {error && (
          <div className="text-red-500 text-center max-w-md">{error}</div>
        )}
        <div className="mt-4">
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Function to handle the refresh button click
  const handleRefresh = async () => {
    if (!user) {
      setError('Bạn cần đăng nhập để cập nhật thông tin');
      return;
    }
    
    setRefreshing(true);
    setError(null);
    try {
      // Lấy userId từ localStorage (cho chắc chắn)
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Không tìm thấy thông tin đăng nhập, vui lòng đăng nhập lại');
      }
      
      const userJson = JSON.parse(userData);
      if (!userJson.userId) {
        throw new Error('Không tìm thấy ID người dùng, vui lòng đăng nhập lại');
      }
      
      // Gọi API để lấy thông tin mới nhất
      const me = await getCurrentCustomer();
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: me.name || prev.name,
          email: me.email || prev.email,
          phone: me.phone || prev.phone,
          address: me.address || prev.address,
          orderCount: me.orderCount || prev.orderCount || 0,
          totalSpent: me.totalSpent || prev.totalSpent || 0,
          recentOrders: me.recentOrders || prev.recentOrders || [],
          updatedAt: me.updatedAt || prev.updatedAt,
        };
      });
      
      // Cập nhật form nếu cần
      if (me) {
        setForm(prev => ({
          ...prev,
          name: me.name || prev.name,
          email: me.email || prev.email,
          phone: me.phone || prev.phone,
          address: me.address || prev.address
        }));
      }
    } catch (e: unknown) {
      console.error('Error refreshing user profile:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h1>
          <div className="flex items-center gap-2">
            <Link to="/orderhistory" className="text-blue-600 hover:underline text-sm">
              Xem đơn hàng
            </Link>
            <RefreshButton onClick={handleRefresh} loading={refreshing} />
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            <div className="font-medium mb-1">Có lỗi xảy ra:</div>
            <div>{error}</div>
            {error.includes('đăng nhập') && (
              <div className="mt-2">
                <Link to="/login" className="text-blue-600 underline">Đăng nhập lại</Link>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 mb-2">
            {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
          </div>
          <div className="text-lg font-semibold text-gray-800">{profile.name}</div>
          <div className="text-sm text-gray-500">{profile.email}</div>
          <div className="text-sm text-gray-500">Vai trò: {profile.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</div>
        </div>
        
        {/* Customer metrics display */}
        <ProfileMetrics customer={profile} />
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={!editing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={!editing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              disabled={!editing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo tài khoản</label>
            <input
              type="text"
              value={profile.createdAt ? new Date(profile.createdAt).toLocaleString() : ''}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="flex justify-center gap-4 mt-6">
            {!editing ? (
              <Button type="button" className="bg-blue-600 text-white px-6" onClick={() => setEditing(true)}>
                Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button type="submit" className="bg-green-600 text-white px-6">
                  Lưu
                </Button>
                <Button type="button" className="bg-gray-400 text-white px-6" onClick={() => setEditing(false)}>
                  Hủy
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
