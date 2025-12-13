import React, { useState, useEffect, useRef } from 'react';
import { getCurrentCustomer } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/UI/Button';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { AlertCircle, Package, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

// LƯU Ý: Đổi PORT này thành port backend .NET thực tế của bạn (ví dụ 5000, 5001, 7000...)
const BACKEND_URL = 'http://localhost:5032'; 

const CheckoutOnline: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};

  // Lấy orderId từ params hoặc state
  const searchParams = new URLSearchParams(location.search);
  const orderIdFromQuery = searchParams.get('orderId');
  const [orderId] = useState<number | null>(state.orderId || (orderIdFromQuery ? Number(orderIdFromQuery) : null));

  // State thông tin người dùng
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { user } = useAuth();
  
  // State đơn hàng
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>('PENDING'); // Trạng thái đơn hàng
  
  // State xử lý
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleOrderSuccess } = useCart();

  // State PayOS
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false); 
  
  // Dùng ref để tránh gọi API tạo link 2 lần (Strict Mode của React 18)
  const hasCreatedLink = useRef(false);

  // 1. Lấy thông tin đơn hàng & User
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng.');
        return;
      }
      setIsProcessing(true);
      try {
        // Gọi API lấy chi tiết đơn hàng
        const order = await orderService.getOrderById(orderId);
        setItems(order.items || []);
        setTotal(order.totalAmount || 0);
        setStatus(order.status || 'PENDING');

        // Nếu đơn hàng đã PAID rồi thì set luôn
        if (order.status === 'PAID' || order.status === 'COMPLETED') {
            setIsPaid(true);
        }

        // Parse địa chỉ giao hàng
        if (order.shippingAddress) {
          const parts = order.shippingAddress.split(',').map((s: string) => s.trim());
          setName(parts[0] || '');
          setPhone(parts[1] || '');
          setAddress(parts[2] || '');
        }
      } catch (err) {
        setError('Không thể lấy thông tin đơn hàng.');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // 2. Tạo Link Thanh Toán PayOS (Chỉ chạy 1 lần khi có total > 0)
  useEffect(() => {
    const createLink = async () => {
        if (orderId && total > 0 && !checkoutUrl && !isPaid && !hasCreatedLink.current) {
            hasCreatedLink.current = true; // Đánh dấu đã gọi
            try {
                console.log("Đang tạo link thanh toán PayOS...");
                
                const res = await axios.post(`${BACKEND_URL}/api/payos/create-payment-link`, {
                    productName: `Don hang #${orderId}`,
                    description: `Thanh toan don #${orderId}`,
                    price: total,
                    returnUrl: window.location.href, // Quay lại trang hiện tại sau khi thanh toán
                    cancelUrl: window.location.href
                });

                if (res.data && res.data.checkoutUrl) {
                    setCheckoutUrl(res.data.checkoutUrl);
                }
            } catch (err) {
                console.error("Lỗi tạo link PayOS:", err);
                // Không set Error chặn màn hình, để user có thể reload thử lại
            }
        }
    };
    createLink();
  }, [orderId, total, isPaid, checkoutUrl]);

  // 3. Polling: Tự động check trạng thái mỗi 3 giây
  useEffect(() => {
    let intervalId: any;

    if (orderId && !isPaid) {
        intervalId = setInterval(async () => {
            try {
                // Gọi service kiểm tra đơn hàng (hoặc viết hàm check riêng cho nhẹ)
                const order = await orderService.getOrderById(orderId);
                console.log(`Checking order #${orderId} status:`, order.status);
                
                if (order.status === 'PAID' || order.status === 'COMPLETED') {
                    setIsPaid(true);
                    clearInterval(intervalId); // Dừng check
                    handleOrderSuccess(); // Xóa giỏ hàng (context)
                }
            } catch (err) {
                // Lỗi mạng thì bỏ qua, đợi lần check sau
            }
        }, 3000); // 3000ms = 3 giây
    }

    // Cleanup khi component unmount
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, isPaid, handleOrderSuccess]);

  // Xử lý khi bấm nút "Mở trang thanh toán"
  const handleOpenPayment = () => {
      if (checkoutUrl) {
          window.open(checkoutUrl, '_blank');
      }
  };

  // --- GIAO DIỆN KHI THANH TOÁN THÀNH CÔNG ---
  if (isPaid) {
    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center py-10 px-4">
             <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-200 animate-fade-in-up">
                <div className="mx-auto bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-700 mb-2">Thanh toán thành công!</h2>
                <p className="text-gray-600 mb-8 text-lg">Đơn hàng <span className="font-bold">#{orderId}</span> đã được hệ thống xác nhận.</p>
                
                <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all" onClick={() => navigate('/order-history')}>
                        Xem chi tiết đơn hàng
                    </Button>
                    <Button className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                </div>
             </div>
        </div>
    );
  }

  // --- GIAO DIỆN THANH TOÁN (PENDING) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100 flex flex-col md:flex-row">
        
        {/* CỘT TRÁI: THANH TOÁN */}
        <div className="md:w-1/2 p-8 bg-blue-50/50 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-200">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Cổng thanh toán</h2>
                <p className="text-gray-500 text-sm">Quét QR hoặc chuyển khoản để hoàn tất</p>
            </div>

            {/* Khu vực hiển thị QR/Button */}
            <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-blue-100 text-center">
                {isProcessing ? (
                    <div className="py-10">
                        <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-500"/>
                        <p className="text-gray-500">Đang tải thông tin...</p>
                    </div>
                ) : checkoutUrl ? (
                    <>
                        <img 
                            src="https://img.vietqr.io/image/MB-PAYOS-compact2.png" 
                            alt="PayOS Logo" 
                            className="h-8 mx-auto mb-6 opacity-80" 
                        />
                        
                        <div className="mb-6">
                            <div className="text-sm text-gray-400 mb-1">Tổng thanh toán</div>
                            <div className="text-3xl font-bold text-blue-600">{total.toLocaleString()} đ</div>
                        </div>

                        <Button 
                            onClick={handleOpenPayment}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition hover:scale-[1.02]"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Mở trang thanh toán (QR)
                        </Button>
                        
                        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 py-2 px-4 rounded-full animate-pulse">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang chờ xác nhận thanh toán...</span>
                        </div>
                    </>
                ) : (
                    <div className="py-8">
                         <div className="text-red-500 mb-2 font-medium">Chưa tạo được link thanh toán</div>
                         <Button onClick={() => window.location.reload()} className="text-sm underline text-blue-500">
                            Thử tải lại trang
                         </Button>
                    </div>
                )}
            </div>
            
            <div className="mt-6 text-xs text-gray-400 text-center max-w-xs">
                Hệ thống sẽ tự động cập nhật trạng thái sau khi bạn chuyển khoản thành công (không cần tải lại trang).
            </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN ĐƠN HÀNG */}
        <div className="md:w-1/2 p-8 bg-white">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-700">Đơn hàng #{orderId}</h3>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wide">
                    {status}
                </span>
            </div>

            <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {items.length > 0 ? items.map((item: any, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1 pr-4">
                            <div className="font-medium text-gray-800 truncate">{item.productName || item.product?.name}</div>
                            <div className="text-gray-400 text-xs">Số lượng: {item.quantity}</div>
                        </div>
                        <div className="font-semibold text-gray-700">
                            {(item.price * item.quantity).toLocaleString()} đ
                        </div>
                    </div>
                )) : <p className="text-gray-400 text-sm">Không có sản phẩm</p>}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center text-gray-500 text-sm mb-2">
                    <span>Tạm tính</span>
                    <span>{total.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">{total.toLocaleString()} đ</span>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin giao hàng</h4>
                <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{name}</p>
                    <p>{phone}</p>
                    <p className="text-gray-500 leading-snug">{address}</p>
                </div>
            </div>

            <div className="mt-6 text-center">
                <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 underline">
                    Quay lại trang chủ (Hủy thanh toán)
                </button>
            </div>
        </div>
      </div>

      {/* ERROR TOAST (Nếu có lỗi) */}
      {error && (
        <div className="fixed bottom-5 right-5 bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-4 flex items-center animate-bounce-in">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
                <p className="font-bold text-red-700">Lỗi</p>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutOnline;