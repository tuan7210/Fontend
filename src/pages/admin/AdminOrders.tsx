import React, { useEffect, useState } from 'react';
import { Order, OrderResponse } from '../../types';
import { ShoppingCart, Search, Eye, Truck, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { orderService } from '../../services/orderService';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders(search);
      setOrders(data);
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderResponse['status']) => {
    setUpdatingOrder(orderId);
    await orderService.updateOrderStatus(orderId, newStatus);
    setSelectedOrder(null);
    setUpdatingOrder(null);
    fetchOrders();
  };
  
  const getStatusName = (status: OrderResponse['status']): string => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };
  
  const getStatusIcon = (status: OrderResponse['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };
  
  const getStatusColor = (status: OrderResponse['status']): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const onViewOrderDetail = async (order: OrderResponse) => {
    const orderDetail = await orderService.getOrderById(order.orderId);
    setSelectedOrder(orderDetail);
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Quản lý đơn hàng
        </h1>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => {setSearch(e.target.value); fetchOrders()}}
            placeholder="Tìm kiếm tên khách hàng"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="py-3 px-4 text-left">Mã đơn</th>
              <th className="py-3 px-4 text-left">Khách hàng</th>
              <th className="py-3 px-4 text-left">Tổng tiền</th>
              <th className="py-3 px-4 text-left">Trạng thái</th>
              <th className="py-3 px-4 text-left">Ngày tạo</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <LoadingSpinner size="md" />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Không có đơn hàng nào phù hợp.
                </td>
              </tr>
            ) : (
              orders.map((order: OrderResponse) => (
                <tr key={order.orderId} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-800">{order.orderId}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div>{order.username}</div>
                  </td>
                  <td className="py-3 px-4 text-blue-700 font-bold">{order.totalAmount.toLocaleString()} đ</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusName(order.status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      className="p-2 rounded hover:bg-blue-50 text-blue-600"
                      onClick={() => onViewOrderDetail(order)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              {/* <h2 className="text-xl font-bold text-blue-700">Chi tiết đơn hàng #{selectedOrder.orderId}</h2> */}
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Thông tin đơn hàng</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold">{selectedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt hàng:</span>
                    <span>{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusName(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-bold text-blue-700">{selectedOrder.totalAmount.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Thông tin khách hàng</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên:</span>
                    <span>{selectedOrder.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{selectedOrder.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span>{selectedOrder.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="text-right">{selectedOrder.shippingAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản phẩm đã đặt</h3>
              <div className="overflow-x-auto bg-gray-50 rounded-lg">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Sản phẩm</th>
                      <th className="py-2 px-4 text-center">Hình ảnh</th>
                      <th className="py-2 px-4 text-center">Đơn giá</th>
                      <th className="py-2 px-4 text-center">Số lượng</th>
                      <th className="py-2 px-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-3 px-4 font-medium">{item.productName}</td>
                        <td className="py-3 px-4 text-center">
                          <img 
                            // src={item.product.image} 
                            // alt={item.product.name} 
                            className="w-16 h-16 object-cover rounded mx-auto"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">{item.price.toLocaleString()} đ</td>
                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">
                          {(item.subtotal).toLocaleString()} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className="py-3 px-4 text-right">Tổng cộng:</td>
                      <td className="py-3 px-4 text-right text-blue-700 font-bold">{selectedOrder.totalAmount.toLocaleString()} đ</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Cập nhật trạng thái đơn hàng</h3>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status !== 'pending' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'pending')}
                    className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"
                    disabled={updatingOrder === selectedOrder.orderId}
                  >
                    <Clock className="w-4 h-4" />
                    Chờ xác nhận
                  </Button>
                )}
                
                {selectedOrder.status !== 'processing' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'processing')}
                    className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1"
                    disabled={updatingOrder === selectedOrder.orderId}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Đang xử lý
                  </Button>
                )}
                
                {selectedOrder.status !== 'shipped' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'shipped')}
                    className="bg-purple-500 hover:bg-purple-600 flex items-center gap-1"
                    disabled={updatingOrder === selectedOrder.orderId}
                  >
                    <Truck className="w-4 h-4" />
                    Đang giao
                  </Button>
                )}
                
                {selectedOrder.status !== 'delivered' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'delivered')}
                    className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
                    disabled={updatingOrder === selectedOrder.orderId}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Đã giao
                  </Button>
                )}
                
                {selectedOrder.status !== 'cancelled' && (
                  <Button
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                        handleUpdateStatus(selectedOrder.orderId, 'cancelled');
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 flex items-center gap-1"
                    disabled={updatingOrder === selectedOrder.orderId}
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đơn
                  </Button>
                )}
                
                {updatingOrder === selectedOrder.orderId && (
                  <span className="flex items-center gap-2 text-gray-600">
                    <LoadingSpinner size="sm" />
                    Đang cập nhật...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
