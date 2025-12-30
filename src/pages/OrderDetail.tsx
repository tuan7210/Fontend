import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, OrderResponse } from '../types';
import { orderService } from '../services/orderService';
import { CheckCircle2, Clock, Truck, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const statusMessages: Record<string, string> = {
  pending: 'Đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận.',
  processing: 'Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.',
  shipped: 'Đơn hàng của bạn đang được giao đến địa chỉ của bạn.',
  delivered: 'Đơn hàng của bạn đã được giao thành công.',
  cancelled: 'Đơn hàng đã bị hủy.'
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
  const orderData: OrderResponse = await orderService.getOrderById(id);
        
        // Map OrderResponse -> Order chuẩn cho UI
        if (orderData) {
          const mappedOrder: Order = {
            id: orderData.orderId?.toString() || id.toString(),
            userId: orderData.userId?.toString() || orderData.username || '',
            items: (orderData.items || []).map((item: any) => ({
              id: item.orderItemId?.toString() || item.id?.toString() || '',
              product: {
                id: item.productId?.toString() || '',
                name: item.productName || '',
                price: item.price || 0,
                image: item.imageUrl || '',
                category: '',
                brand: '',
                description: '',
                specifications: {},
                stock: 0,
                rating: 0,
                reviews: 0,
              },
              quantity: item.quantity || 0,
            })),
            total: orderData.totalAmount || 0,
            status: orderData.status as any,
            shippingAddress: {
              firstName: '',
              lastName: '',
              email: orderData.email || '',
              phone: orderData.phone || '',
              address: typeof orderData.shippingAddress === 'string' ? orderData.shippingAddress : '',
              city: '',
              zipCode: '',
            },
            paymentMethod: orderData.paymentMethod,
            paymentStatus: orderData.paymentStatus,
            createdAt: orderData.orderDate ? new Date(orderData.orderDate).toISOString() : new Date().toISOString(),
            updatedAt: orderData.orderDate ? new Date(orderData.orderDate).toISOString() : new Date().toISOString(),
          };
          if (user?.role === 'admin' || mappedOrder.userId === user?.email) {
            setOrder(mappedOrder);
          } else {
            setOrder(null);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, user]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Không tìm thấy đơn hàng</h1>
          <p className="text-gray-600 mb-6">
            Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.
          </p>
          <Link to="/order-history" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/order-history" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách đơn hàng
          </Link>
          <div className="text-sm text-gray-500">Đơn hàng được đặt vào ngày {new Date(order.createdAt).toLocaleDateString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
                <p className="text-gray-600 text-sm">Mã đơn hàng: #{order.id}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusColors[order.status]}`}>
                {getStatusIcon(order.status)}
                <span className="font-medium">
                  {order.status === 'pending' && 'Chờ xác nhận'}
                  {order.status === 'processing' && 'Đang xử lý'}
                  {order.status === 'shipped' && 'Đang giao'}
                  {order.status === 'delivered' && 'Đã giao'}
                  {order.status === 'cancelled' && 'Đã hủy'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Thông tin giao hàng</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-800">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p className="text-gray-600">{order.shippingAddress.email}</p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">Phương thức thanh toán: </span>
                    {order.paymentMethod === 'online'
                      ? 'Chuyển khoản'
                      : order.paymentMethod === 'cash_on_delivery'
                        ? 'Thanh toán khi nhận hàng'
                        : order.paymentMethod
                          ? order.paymentMethod
                          : 'Không xác định'}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium">Trạng thái thanh toán: </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Trạng thái đơn hàng</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className={`mb-3 p-3 rounded-lg border ${statusColors[order.status]}`}>
                    <div className="flex items-center gap-2 font-medium">
                      {getStatusIcon(order.status)}
                      {order.status === 'pending' && 'Chờ xác nhận'}
                      {order.status === 'processing' && 'Đang xử lý'}
                      {order.status === 'shipped' && 'Đang giao'}
                      {order.status === 'delivered' && 'Đã giao'}
                      {order.status === 'cancelled' && 'Đã hủy'}
                    </div>
                    <p className="mt-2 text-sm">{statusMessages[order.status]}</p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Cập nhật gần nhất: {new Date(order.updatedAt).toLocaleDateString()}, {new Date(order.updatedAt).toLocaleTimeString()}
                  </p>
                  {order.status === 'pending' && (
                    <div className="mt-3">
                      <Button 
                        className="bg-red-500 hover:bg-red-600 text-sm w-full"
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
                            // Gọi API hủy đơn hàng
                            orderService.updateOrderStatus(Number(order.id), 'cancelled')
                              .then(updatedOrder => {
                                if (updatedOrder) {
                                  setOrder({...order, status: 'cancelled', updatedAt: new Date().toISOString()});
                                  alert('Đơn hàng đã được hủy thành công');
                                }
                              })
                              .catch(() => {
                                alert('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
                              });
                          }
                        }}
                      >
                        Hủy đơn hàng
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sản phẩm đã đặt</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img className="h-12 w-12 rounded-md object-cover" src={item.product.image} alt={item.product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                            <div className="text-xs text-gray-500">{item.product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {item.product.price.toLocaleString()} đ
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(item.product.price * item.quantity).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right text-sm font-medium text-gray-700">Tổng thanh toán:</td>
                    <td className="px-4 py-4 text-right text-lg font-bold text-blue-700">{order.total.toLocaleString()} đ</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.status === 'delivered' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Đánh giá sản phẩm</h2>
            <p className="text-gray-600 mb-4">Đơn hàng đã giao thành công. Bạn có thể đánh giá các sản phẩm bằng cách vào trang Quản lý đơn hàng.</p>
            <Link to="/order-history" className="text-blue-600 hover:underline">
              Đến trang Quản lý đơn hàng
            </Link>
          </div>
        )}

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">
              Cảm ơn bạn đã mua sắm tại cửa hàng chúng tôi! Chúng tôi sẽ xử lý đơn hàng của bạn nhanh nhất có thể.
            </p>
            <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Tiếp tục mua sắm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
