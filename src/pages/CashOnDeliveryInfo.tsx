import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Phone, User, Package } from 'lucide-react';
import Button from '../components/UI/Button';
import { useLocation, useNavigate } from 'react-router-dom';

const CashOnDeliveryInfo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    items = [], 
    total = 0, 
    name = 'Nguyễn Văn Tuấn', 
    phone = '0123 456 789', 
    address = '12 Nguyễn Trãi, Hà Nội',
    orderId = 'N/A' 
  } = location.state || {};
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-blue-100">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-700 mb-6">Cảm ơn bạn đã chọn phương thức <span className="font-semibold text-green-600">Thanh toán khi nhận hàng</span>.</p>
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center mb-2">
            <User className="w-5 h-5 text-blue-400 mr-2" />
            <span className="font-medium">Tên khách hàng:</span>
            <span className="ml-2 text-blue-700">{name}</span>
          </div>
          <div className="flex items-center mb-2">
            <Phone className="w-5 h-5 text-blue-400 mr-2" />
            <span className="font-medium">Số điện thoại:</span>
            <span className="ml-2 text-blue-700">{phone}</span>
          </div>
          <div className="flex items-center">
            <Home className="w-5 h-5 text-blue-400 mr-2" />
            <span className="font-medium">Địa chỉ nhận hàng:</span>
            <span className="ml-2 text-blue-700">{address}</span>
          </div>
        </div>
        {/* Thông tin đơn hàng */}
        <div className="mb-6 bg-green-50 rounded-xl p-4 text-left border border-green-100">
          <div className="font-bold text-green-700 mb-2">Thông tin đơn hàng</div>
          {items.length === 0 ? (
            <div className="text-gray-500">Không có sản phẩm nào trong đơn hàng.</div>
          ) : (
            <ul className="mb-3">
              {items.map((item: any) => (
                <li key={item.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-gray-800">{item.product.name}</span>
                  <span className="text-gray-600">x{item.quantity}</span>
                  <span className="text-blue-700 font-semibold">{(item.product.price * item.quantity).toLocaleString()} đ</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between items-center font-bold text-lg mt-2">
            <span>Tổng cộng:</span>
            <span className="text-green-700">{total.toLocaleString()} đ</span>
          </div>
        </div>
        <div className="mb-6">
          <span className="block text-gray-600 mb-2">Nhân viên giao hàng sẽ liên hệ với bạn để xác nhận đơn và giao hàng tận nơi.</span>
          <span className="block text-green-700 font-semibold">Vui lòng chuẩn bị số tiền cần thanh toán khi nhận hàng.</span>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100 flex items-center">
          <Package className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <span className="font-semibold block">Mã đơn hàng:</span>
            <span className="text-blue-700 font-bold">{orderId}</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 mb-3">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:from-blue-700 hover:to-green-600 transition-all text-lg"
            onClick={() => navigate(`/order-detail/${orderId}`)}
          >
            Xem chi tiết đơn hàng
          </Button>
          
          <Button 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all text-lg"
            onClick={() => navigate('/order-history')}
          >
            Xem lịch sử đơn hàng
          </Button>
        </div>
        <Link to="/" className="block text-blue-600 hover:text-blue-700 font-medium mt-2">Quay về trang chủ</Link>
      </div>
    </div>
  );
};

export default CashOnDeliveryInfo;
