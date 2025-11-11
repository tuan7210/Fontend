import React, { useState } from 'react';
// Nếu bạn bị lỗi đỏ ở dòng này, có thể do axios chưa được cài đặt trong project.
// Chạy lệnh: npm install axios
// Dùng orderService để đảm bảo baseURL + Authorization header chính xác
import { orderService } from '../services/orderService';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfStock, setOutOfStock] = useState<
    { productId: number; productName: string; message: string }[]
  >([]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);
      setOutOfStock([]);
      // Gửi danh sách sản phẩm lên API kiểm tra tồn kho
      const cartCheck = items.map((item) => ({
        productId: Number(item.product.id),
        quantity: item.quantity,
      }));
      const res = await orderService.checkCartStock(cartCheck);
      if (res && res.success) {
        // Điều hướng sang trang xác nhận, truyền phương thức thanh toán qua route state
        navigate('/cash-on-delivery-confirm', { state: { paymentMethod } });
      } else {
        setError(res?.message || 'Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ số lượng');
        setOutOfStock(res?.outOfStock || []);
      }
    } catch (error) {
      setError(typeof error === 'string' ? error : 
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi kiểm tra tồn kho');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng của bạn đang trống</h1>
          <p className="text-gray-600 mb-8">Thêm sản phẩm để bắt đầu mua sắm</p>
          <Link to="/">
            <Button>
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-gray-800 mb-8">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {items.map((item) => (
                <div key={item.id} className="flex items-center p-6 border-b border-gray-200 last:border-b-0">
                  <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </Link>
                  
                  <div className="ml-6 flex-1">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-gray-600">{item.product.brand}</p>
                    <p className="text-lg font-bold text-gray-800 mt-2">{item.product.price.toLocaleString()} đ</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock || item.product.stock === 0}
                        className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={item.product.stock === 0 ? 'Sản phẩm đã hết hàng' : item.quantity >= item.product.stock ? 'Đã đạt số lượng tối đa tồn kho' : ''}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {item.product.stock === 0 && (
                    <div className="text-xs text-red-600 mt-2 font-semibold bg-red-50 border border-red-200 rounded px-2 py-1">
                      <span className="mr-1">⚠️</span>Sản phẩm này đã hết hàng. Vui lòng xóa khỏi giỏ hoặc chọn sản phẩm khác.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{getTotalPrice().toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế:</span>
                  <span>{Math.round(getTotalPrice() * 0.08).toLocaleString()} đ</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng:</span>
                    <span>{Math.round(getTotalPrice() * 1.08).toLocaleString()} đ</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="font-semibold mb-3 text-lg">Phương thức thanh toán:</div>
                <div className="grid grid-cols-1 gap-3">
                  <label
                    className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm gap-3 ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="hidden"
                    />
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="ml-2 text-base font-medium text-blue-700">Thanh toán khi nhận hàng</span>
                  </label>
                  <label
                    className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm gap-3 ${paymentMethod === 'online' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="hidden"
                    />
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 10v6m8-10a8 8 0 11-16 0 8 8 0 0116 0z" />
                      </svg>
                    </span>
                    <span className="ml-2 text-base font-medium text-green-700">Thanh toán Online</span>
                  </label>
                </div>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <div className="flex items-center mb-1">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  {outOfStock.length > 0 && (
                    <ul className="list-disc pl-6 text-sm">
                      {outOfStock.map((item) => (
                        <li key={item.productId}>
                          <span className="font-semibold">{item.productName}:</span> {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <Button 
                onClick={handleCheckout} 
                className="w-full" 
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    Thanh toán
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              <Link to="/" className="block text-center text-blue-600 hover:text-blue-700 mt-4">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;