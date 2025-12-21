
import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Eye } from 'lucide-react';
import { http } from '../../services/orderService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

type PaidOrder = {
  orderId: string | number;
  customerName: string;
  customerEmail: string;
  orderTime: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'text-green-600 bg-green-100';
    case 'shipped': return 'text-blue-600 bg-blue-100';
    case 'processing': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'text-green-600 bg-green-100';
    case 'pending': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const AdminDashboard = () => {
  // State for growth
  const [growth, setGrowth] = useState<number | null>(null);
  const [growthType, setGrowthType] = useState<'up' | 'down' | 'equal' | null>(null);
  const [activeTab, setActiveTab] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // State for API data
  const [revenue, setRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Chart series state
  const [seriesData, setSeriesData] = useState<Array<{ label: string; value: number }>>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // Fetch revenue, order count, paid orders
  useEffect(() => {
    let isMounted = true;
  setLoading(true);
  const fetchData = async () => {
      try {
        // Revenue hiện tại
        let revenueUrl = '/api/Order/revenue?type=day&date=' + selectedDate;
        let prevRevenueUrl = '';
        let prevLabel = '';
        if (activeTab === 'month') {
          revenueUrl = `/api/Order/revenue?type=month&date=${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
          // Tháng trước
          let prevMonth = selectedMonth - 1;
          let prevYear = selectedYear;
          if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
          prevRevenueUrl = `/api/Order/revenue?type=month&date=${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
          prevLabel = `Tháng ${prevMonth}/${prevYear}`;
        } else if (activeTab === 'year') {
          revenueUrl = `/api/Order/revenue?type=year&date=${selectedYear}-01-01`;
          prevRevenueUrl = `/api/Order/revenue?type=year&date=${selectedYear - 1}-01-01`;
          prevLabel = `Năm ${selectedYear - 1}`;
        } else {
          // Ngày trước đó
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 1);
          const prevDate = d.toISOString().split('T')[0];
          prevRevenueUrl = `/api/Order/revenue?type=day&date=${prevDate}`;
          prevLabel = d.toLocaleDateString('vi-VN');
        }
        const [revenueRes, prevRevenueRes] = await Promise.all([
          http<any>(revenueUrl),
          http<any>(prevRevenueUrl)
        ]);
        const currentRevenue = revenueRes.data?.totalRevenue || 0;
        const prevRevenue = prevRevenueRes.data?.totalRevenue || 0;
        setRevenue(currentRevenue);

        // Tính tăng trưởng
        if (prevRevenue === 0 && currentRevenue === 0) {
          setGrowth(null);
          setGrowthType(null);
        } else if (prevRevenue === 0) {
          setGrowth(100);
          setGrowthType('up');
        } else {
          const percent = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
          setGrowth(Math.abs(percent));
          if (percent > 0) setGrowthType('up');
          else if (percent < 0) setGrowthType('down');
          else setGrowthType('equal');
        }

        // Order count (today only)
        if (activeTab === 'day') {
          const countRes = await http<any>('/api/Order/today-count');
          setOrderCount(countRes.data?.count || 0);
        } else {
          setOrderCount(0);
        }

        // Paid orders today (only for day tab)
        if (activeTab === 'day') {
          const paidRes = await http<any>('/api/Order/paid-today');
          setPaidOrders(paidRes.data || []);
        } else {
          setPaidOrders([]);
        }
      } catch (e) {
        setRevenue(0);
        setOrderCount(0);
        setPaidOrders([]);
        setGrowth(null);
        setGrowthType(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  // Fetch revenue series for chart
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setSeriesLoading(true);
        let url = '';
        if (activeTab === 'day') {
          // Default: show past 7 days including selectedDate
          const end = new Date(selectedDate);
          const start = new Date(selectedDate);
          start.setDate(start.getDate() - 6);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];
          url = `/api/Order/revenue-series?granularity=day&start=${startStr}&end=${endStr}`;
          const res = await http<any>(url);
          const points = (res.data || []).map((d: any) => ({
            label: d.date,
            value: Number(d.totalRevenue || 0)
          }));
          setSeriesData(points);
        } else if (activeTab === 'month') {
          url = `/api/Order/revenue-series?granularity=month&year=${selectedYear}`;
          const res = await http<any>(url);
          const points = (res.data || []).map((d: any) => ({
            label: String(d.month).padStart(2, '0') + '/' + String(selectedYear),
            value: Number(d.totalRevenue || 0)
          }));
          setSeriesData(points);
        } else if (activeTab === 'year') {
          const startYear = selectedYear - 5;
          const endYear = selectedYear;
          url = `/api/Order/revenue-series?granularity=year&start=${startYear}&end=${endYear}`;
          const res = await http<any>(url);
          const points = (res.data || []).map((d: any) => ({
            label: String(d.year),
            value: Number(d.totalRevenue || 0)
          }));
          setSeriesData(points);
        }
      } catch (e) {
        setSeriesData([]);
      } finally {
        setSeriesLoading(false);
      }
    };
    fetchSeries();
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Quản trị</h1>
          <p className="text-gray-600">Theo dõi doanh thu và đơn hàng của cửa hàng</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doanh thu {activeTab === 'day' ? 'trong ngày' : activeTab === 'month' ? 'tháng' : 'năm'}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue)}</p>
              </div>
            </div>
          </div>
          {activeTab === 'day' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đơn hàng trong ngày</p>
                  <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${growthType === 'up' ? 'bg-green-100' : growthType === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
                <TrendingUp className={`h-6 w-6 ${growthType === 'up' ? 'text-green-600' : growthType === 'down' ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tăng trưởng</p>
                <p className={`text-2xl font-bold ${growthType === 'up' ? 'text-green-600' : growthType === 'down' ? 'text-red-600' : 'text-gray-900'}`}>
                  {growth !== null ?
                    (growthType === 'equal' ? '0%' : `${growthType === 'down' ? '-' : '+'}${growth.toFixed(1)}%`)
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'day', label: 'Theo ngày', icon: Calendar },
                { key: 'month', label: 'Theo tháng', icon: TrendingUp },
                { key: 'year', label: 'Theo năm', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Date/Month/Year Selector */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {activeTab === 'day' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              {activeTab === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
              )}
              {activeTab === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>Năm {year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Biểu đồ doanh thu {activeTab === 'day' ? 'theo ngày (7 ngày gần nhất)' : activeTab === 'month' ? `theo tháng (${selectedYear})` : `theo năm (${selectedYear - 5}–${selectedYear})`}
            </h3>
          </div>
          <div className="p-6">
            {seriesLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Đang tải dữ liệu biểu đồ...</div>
            ) : seriesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Không có dữ liệu để hiển thị.</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {activeTab === 'day' ? (
                    <LineChart data={seriesData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(Number(v)).replace('₫', '')} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelFormatter={(l: any) => l} />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={seriesData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatCurrency(Number(v)).replace('₫', '')} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelFormatter={(l: any) => l} />
                      <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Paid Orders Today (only for day tab) */}
        {activeTab === 'day' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Đơn hàng đã thanh toán ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(!showOrderDetails)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  {showOrderDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </button>
              </div>
            </div>

            {showOrderDetails && (
              <div className="p-6">
                <div className="space-y-6">
                  {paidOrders.length === 0 && <div className="text-gray-500">Không có đơn hàng đã thanh toán hôm nay.</div>}
                  {paidOrders.map((order) => (
                    <div key={order.orderId} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Đơn hàng #{order.orderId}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.customerName} - {order.customerEmail}
                          </p>
                          <p className="text-sm text-gray-500">
                            Thời gian: {order.orderTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <h5 className="font-medium text-gray-900 mb-3">Sản phẩm:</h5>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-3">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;