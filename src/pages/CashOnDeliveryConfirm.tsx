import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentCustomer } from '../services/userService';
import Button from '../components/UI/Button';
import { orderService, CreateOrderRequest } from '../services/orderService';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

const CashOnDeliveryConfirm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getTotalPrice, handleOrderSuccess } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // city, zipCode không còn cần nếu shippingAddress chỉ là một chuỗi địa chỉ đầy đủ
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Nhận phương thức thanh toán từ route state thay vì localStorage
  const location = useLocation();
  const routeState = (location.state as any) || {};
  const paymentMethod: 'cod' | 'online' = routeState.paymentMethod === 'online' ? 'online' : 'cod';
  
  useEffect(() => {
    // Ưu tiên lấy thông tin cá nhân từ API nếu đã đăng nhập
    const fetchCustomerInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const customer = await getCurrentCustomer();
          setName(customer.name || '');
          setPhone(customer.phone || '');
          setAddress(customer.address || '');
        } else if (user) {
          // Fallback: chỉ lấy name từ user context
          setName(user.name || '');
        }
      } catch (e) {
        // Nếu lỗi vẫn fallback lấy từ localStorage hoặc context
        if (user) setName(user.name || '');
      }
    };
    fetchCustomerInfo();

  }, [user]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setError(null);
      const cleanAddress = (address || '').trim();
      if (!cleanAddress) {
        setError('Vui lòng nhập địa chỉ nhận hàng');
        setIsProcessing(false);
        return;
      }
      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Vui lòng đăng nhập để đặt hàng");
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
  // Lấy sản phẩm trực tiếp từ context (đã đồng bộ với backend)
  const orderItems = items;
      if (orderItems.length === 0) {
        setError("Không có sản phẩm nào trong đơn hàng");
        setIsProcessing(false);
        return;
      }
      if (paymentMethod === 'online') {
        // Tạo đơn hàng online tại đây, sau đó chuyển sang trang checkout-online để hiển thị QR và thông tin
        const orderRequest: CreateOrderRequest = {
          items: orderItems.map(item => ({
            productId: parseInt(item.product.id),
            quantity: item.quantity
          })),
          // Backend mẫu chỉ cần địa chỉ thuần: "Số 1 Nguyễn Trãi, Quận 1, TP.HCM"
          // Người dùng phải nhập đầy đủ địa chỉ vào ô address.
          shippingAddress: cleanAddress,
          paymentMethod: 'online'
        };
        const response = await orderService.createOrder(orderRequest);
        navigate(`/checkout-online?orderId=${response.orderId}`);
        return;
      }
      // Nếu là COD thì giữ nguyên logic đặt hàng
      const orderRequest: CreateOrderRequest = {
        items: orderItems.map(item => ({
          productId: parseInt(item.product.id),
          quantity: item.quantity
        })),
        // Gửi đúng format backend yêu cầu: chỉ địa chỉ
        shippingAddress: cleanAddress,
        paymentMethod: 'cash_on_delivery'
      };
      const response = await orderService.createOrder(orderRequest);
      // Đơn hàng tạo thành công nếu không có lỗi
      await handleOrderSuccess();
      setConfirmed(true);
      setTimeout(() => {
        navigate('/cash-on-delivery-info', {
          state: {
            name,
            phone,
            address,
            items: orderItems,
            total: response.totalAmount || getTotalPrice() * 1.08,
            orderId: response.orderId
          }
        });
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đặt hàng");
      setConfirmed(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center border border-blue-100">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Xác nhận thông tin nhận hàng</h1>
          {/* Thông tin đơn hàng rõ ràng */}
          <div className="mb-6 bg-green-50 rounded-xl p-4 text-left border border-green-100">
            <div className="font-bold text-green-700 mb-4 text-xl">Thông tin đơn hàng</div>
            {(items.length === 0) ? (
              <div className="text-gray-500">Không có sản phẩm nào trong đơn hàng.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm md:text-base border-collapse">
                  <thead>
                    <tr className="bg-green-100 text-green-700">
                      <th className="py-2 px-2 text-left rounded-tl-xl">Sản phẩm</th>
                      <th className="py-2 px-2 text-center">Hình ảnh</th>
                      <th className="py-2 px-2 text-center">Số lượng</th>
                      <th className="py-2 px-2 text-right rounded-tr-xl">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-green-100">
                        <td className="py-2 px-2 font-medium text-gray-800">{item.product.name}</td>
                        <td className="py-2 px-2 text-center">
                          <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg mx-auto shadow" />
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-2 px-2 text-right text-blue-700 font-semibold">{(item.product.price * item.quantity).toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-100">
                      <td className="py-2 px-2 font-bold text-green-700 text-right" colSpan={3}>Tổng cộng:</td>
                      <td className="py-2 px-2 text-right font-bold text-green-700">{(getTotalPrice() * 1.08).toLocaleString()} đ</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        <form onSubmit={handleConfirm} className="space-y-5">
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
              {error.includes('đăng nhập') && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Đăng nhập ngay
                </button>
              )}
            </div>
          )}
          <div className="text-left">
            <label className="block text-sm font-medium text-blue-700 mb-1">Địa chỉ nhận hàng</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: Số 1 Nguyễn Trãi, Quận 1, TP.HCM"
              required
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">Vui lòng nhập đầy đủ số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố.</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:from-blue-700 hover:to-green-600 transition-all text-lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Đang xử lý...
              </span>
            ) : (
              "Xác nhận đặt hàng"
            )}
          </Button>
        </form>
        {confirmed && (
          <div className="mt-6 text-green-700 font-semibold text-lg animate-pulse">
            Đặt hàng thành công! Đang chuyển hướng...
          </div>
        )}
      </div>
    </div>
  );
};

export default CashOnDeliveryConfirm;
