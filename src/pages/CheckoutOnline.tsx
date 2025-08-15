
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/UI/Button';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { AlertCircle, Package, User, Phone, Home } from 'lucide-react';


const CheckoutOnline: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const [orderId, setOrderId] = useState<number | null>(state.orderId || Number(localStorage.getItem('lastOrderId')) || null);
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Luôn lấy thông tin đơn hàng từ backend theo orderId
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng.');
        return;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const order = await orderService.getOrderById(orderId);
        setShipping({
          name: order.shippingAddress?.split(',')[0]?.trim() || '',
          phone: order.shippingAddress?.split(',')[1]?.trim() || '',
          address: order.shippingAddress?.split(',').slice(2).join(',').trim() || ''
        });
        setItems(order.items || []);
        setTotal(order.totalAmount || 0);
        setSuccess(true);
      } catch (err) {
        setError('Không thể lấy thông tin đơn hàng.');
      } finally {
        setIsProcessing(false);
      }
    };
    fetchOrder();
    // eslint-disable-next-line
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-10">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Package className="w-14 h-14 text-blue-500" />
            <div>
              <div className="text-lg font-bold text-blue-700">Đặt hàng thành công!</div>
              <div className="text-gray-700">Cảm ơn bạn đã chọn <span className="font-semibold text-green-600">Thanh toán Online</span></div>
            </div>
          </div>
          <div className="bg-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="font-semibold">Mã đơn hàng:</span>
            <span className="text-blue-700 font-bold text-lg">{orderId ? `#${orderId}` : '(Chưa tạo)'}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR chuyển khoản và hướng dẫn */}
          <div className="flex flex-col items-center justify-center">
            <img
              src={`https://img.vietqr.io/image/970422-123456789-compact2.png?amount=${total}&addInfo=Thanh+toan+cho+don+hang+${orderId ? orderId : 'chua_tao'}`}
              alt="QR chuyển khoản"
              className="w-64 h-64 object-contain rounded-xl border border-blue-200 shadow mb-4"
            />
            <div className="text-center">
              <p className="font-semibold text-lg text-gray-800 mb-1">Quét mã QR để chuyển khoản</p>
              <p className="text-gray-600 text-sm">Nội dung chuyển khoản: <span className="font-bold text-blue-700">Thanh toán cho đơn hàng {orderId ? `#${orderId}` : '(Chưa tạo)'}</span></p>
              <p className="text-gray-500 text-xs mt-2">Vui lòng chuyển đúng nội dung để xác nhận đơn hàng nhanh chóng.</p>
            </div>
          </div>
          {/* Thông tin đơn hàng và giao hàng */}
          <div>
            <div className="mb-6 bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="font-bold text-green-700 mb-2">Thông tin đơn hàng</div>
              {items.length === 0 ? (
                <div className="text-gray-500">Không có sản phẩm nào trong đơn hàng.</div>
              ) : (
                <ul className="mb-3">
                  {items.map((item: any) => (
                    <li key={item.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-800">{item.productName || item.product?.name}</span>
                      <span className="text-gray-600">x{item.quantity}</span>
                      <span className="text-blue-700 font-semibold">{(item.price * item.quantity).toLocaleString()} đ</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between items-center font-bold text-lg mt-2">
                <span>Tổng cộng:</span>
                <span className="text-green-700">{total.toLocaleString()} đ</span>
              </div>
            </div>
            <div className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="font-bold text-blue-700 mb-2">Thông tin giao hàng</div>
              <div className="flex items-center mb-2">
                <User className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-medium">Tên khách hàng:</span>
                <span className="ml-2 text-blue-700">{shipping.name}</span>
              </div>
              <div className="flex items-center mb-2">
                <Phone className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-medium">Số điện thoại:</span>
                <span className="ml-2 text-blue-700">{shipping.phone}</span>
              </div>
              <div className="flex items-center">
                <Home className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-medium">Địa chỉ nhận hàng:</span>
                <span className="ml-2 text-blue-700">{shipping.address}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Button type="button" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-all text-lg" onClick={() => navigate('/') }>
                Xác nhận đã thanh toán
              </Button>
              <Button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all text-lg" onClick={() => navigate('/order-history')}>
                Xem lịch sử đơn hàng
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center mt-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {isProcessing && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 flex items-center mt-4">
            <LoadingSpinner size="sm" className="mr-2" />
            Đang tải thông tin đơn hàng...
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutOnline;
