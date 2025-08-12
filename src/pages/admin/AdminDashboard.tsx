import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, Package, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
// ...existing code...
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ];

  const categoryData = [
    { name: 'Laptops', value: 35, color: '#3B82F6' },
    { name: 'Phones', value: 30, color: '#10B981' },
    { name: 'Tablets', value: 20, color: '#F59E0B' },
    { name: 'Accessories', value: 15, color: '#EF4444' },
  ];

  const orderStatusData = [
    { name: 'Pending', value: 25, color: '#F59E0B' },
    { name: 'Processing', value: 35, color: '#3B82F6' },
    { name: 'Shipped', value: 30, color: '#10B981' },
    { name: 'Delivered', value: 10, color: '#6B7280' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [products, orders] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders(),
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const lowStockProducts = products.filter(product => product.stock < 10).length;

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          totalUsers: 150, // Mock data
          todayOrders: 12, // Mock data
          todayRevenue: 2850, // Mock data
          pendingOrders,
          lowStockProducts,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
  value: `${stats.totalRevenue.toLocaleString()} đ`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+8.2%',
      changeType: 'increase',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+5.1%',
      changeType: 'increase',
    },
    {
      title: 'Customers',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+15.3%',
      changeType: 'increase',
    },
  ];

  const quickStats = [
    {
      title: 'Today\'s Orders',
      value: stats.todayOrders.toString(),
      color: 'text-blue-600',
    },
    {
      title: 'Today\'s Revenue',
  value: `${stats.todayRevenue.toLocaleString()} đ`,
      color: 'text-green-600',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      color: 'text-yellow-600',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts.toString(),
      color: 'text-red-600',
    },
  ];

  return (
    <div className="pt-0 px-6 pb-6 space-y-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-7 border border-blue-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wide">{stat.title}</p>
                <p className="text-3xl font-extrabold text-gray-800 mb-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 font-semibold ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>{stat.change}</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-md`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-2">
        {quickStats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col items-center">
            <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">{stat.title}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-7 border border-blue-100">
          <h2 className="text-xl font-bold mb-6 text-blue-700">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-7 border border-blue-100">
          <h2 className="text-xl font-bold mb-6 text-blue-700">Product Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-2xl shadow-lg p-7 border border-blue-100 mt-4">
        <h2 className="text-xl font-bold mb-6 text-blue-700">Order Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-7 border border-blue-100 mt-4">
        <h2 className="text-xl font-bold mb-6 text-blue-700">Recent Activity</h2>
        <div className="space-y-5">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold">New order #1234 received</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-base font-semibold">Product "iPhone 15 Pro" updated</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shadow">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-base font-semibold">New user registration</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;