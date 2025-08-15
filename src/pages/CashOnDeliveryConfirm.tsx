import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
  const [city] = useState('Hà Nội');
  const [zipCode] = useState('10000');
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load checkout items and payment method from localStorage if they exist
  const [checkoutItems, setCheckoutItems] = useState(items);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  
  useEffect(() => {
    // Load user info if available
    if (user) {
      // Ưu tiên lấy từ userInfo nếu có (có phone, address)
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          setName(userInfo.name || '');
          setPhone(userInfo.phone || '');
          setAddress(userInfo.address || '');
        } catch (e) {}
      } else {
        // Fallback: chỉ lấy name từ user context
        setName(user.name || '');
      }
    }
    // Load stored items
    const storedItems = localStorage.getItem('checkoutItems');
    if (storedItems) {
      try {
        setCheckoutItems(JSON.parse(storedItems));
      } catch (e) {}
    }
    // Load payment method
    const storedPaymentMethod = localStorage.getItem('paymentMethod');
    if (storedPaymentMethod === 'online' || storedPaymentMethod === 'cod') {
      setPaymentMethod(storedPaymentMethod);
    }
  }, [user]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setError(null);
      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Vui lòng đăng nhập để đặt hàng");
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      // Validate form data
      if (!name.trim() || !phone.trim() || !address.trim()) {
        setError("Vui lòng điền đầy đủ thông tin");
        setIsProcessing(false);
        return;
      }
      // Get items either from cart or from localStorage
      const orderItems = checkoutItems.length > 0 ? checkoutItems : items;
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
          shippingAddress: `${name}, ${phone}, ${address}, ${city}, ${zipCode}`,
          paymentMethod: 'online'
        };
        const response = await orderService.createOrder(orderRequest);
        // Lưu orderId vào localStorage để trang checkout-online có thể lấy lại nếu reload
  localStorage.setItem('lastOrderId', String(response.orderId));
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutTotal');
        // Chuyển sang trang checkout-online, truyền orderId và info để hiển thị QR
        navigate('/checkout-online', {
          state: {
            orderId: response.orderId,
            name,
            phone,
            address,
            items: orderItems,
            total: response.totalAmount || getTotalPrice() * 1.08
          }
        });
        return;
      }
      // Nếu là COD thì giữ nguyên logic đặt hàng
      const orderRequest: CreateOrderRequest = {
        items: orderItems.map(item => ({
          productId: parseInt(item.product.id),
          quantity: item.quantity
        })),
        shippingAddress: `${name}, ${phone}, ${address}, ${city}, ${zipCode}`,
        paymentMethod: 'cash_on_delivery'
      };
      const response = await orderService.createOrder(orderRequest);
      // Đơn hàng tạo thành công nếu không có lỗi
      localStorage.removeItem('checkoutItems');
      localStorage.removeItem('checkoutTotal');
      await handleOrderSuccess(orderItems);
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
            {(checkoutItems.length === 0 && items.length === 0) ? (
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
                    {(checkoutItems.length > 0 ? checkoutItems : items).map(item => (
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
                      <td className="py-2 px-2 text-right font-bold text-green-700">{
                        localStorage.getItem('checkoutTotal') ? 
                        Number(localStorage.getItem('checkoutTotal')).toLocaleString() : 
                        (getTotalPrice() * 1.08).toLocaleString()
                      } đ</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        <form onSubmit={handleConfirm} className="space-y-5">
          <div className="text-left">
            <label className="block font-medium mb-1 text-blue-700">Tên khách hàng</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
              required
            />
          </div>
          <div className="text-left">
            <label className="block font-medium mb-1 text-blue-700">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
              required
            />
          </div>
          <div className="text-left">
            <label className="block font-medium mb-1 text-blue-700">Địa chỉ nhận hàng</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
              required
            />
          </div>
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
