import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Link } from 'react-router-dom';

import { Order } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // State cho form đánh giá (di chuyển lên đầu để đúng quy tắc hook)
  const [showReview, setShowReview] = useState<{orderId: string, productId: string} | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  // State cho modal chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Giả lập gọi API lấy đơn hàng của user
        // Lấy đơn hàng theo userId (giả lập: userId là email)
        const data = await orderService.getUserOrders(user?.email || '');
        setOrders(data as Order[]);
      } catch (error) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Kiểm tra đã đánh giá sản phẩm chưa
  const hasReviewed = (productId: string) => {
    const reviewed = localStorage.getItem(`reviewed_${user?.email}_${productId}`);
    return reviewed === 'true';
  };

  const handleOpenReview = (orderId: string, productId: string) => {
    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    if (hasReviewed(productId)) {
      alert('Bạn đã đánh giá sản phẩm này rồi.');
      return;
    }
    
    setShowReview({ orderId, productId });
    setReviewText('');
    setReviewRating(5);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReview) return;
    if (!user?.email) {
      alert('Bạn cần đăng nhập để đánh giá sản phẩm.');
      return;
    }
    
    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    if (hasReviewed(showReview.productId)) {
      alert('Bạn đã đánh giá sản phẩm này rồi.');
      setShowReview(null);
      return;
    }
    
    // Lưu đánh giá vào localStorage
    const review = {
      user: user?.name || user?.email || 'Khách',
      rating: reviewRating,
      comment: reviewText,
      date: new Date().toISOString(),
      productId: showReview.productId
    };
    
    // Lưu đánh giá vào localStorage cho ProductDetail
    const reviews = JSON.parse(localStorage.getItem(`reviews_${showReview.productId}`) || '[]');
    reviews.unshift(review);
    localStorage.setItem(`reviews_${showReview.productId}`, JSON.stringify(reviews));
    
    // Đánh dấu là đã đánh giá sản phẩm này
    localStorage.setItem(`reviewed_${user?.email}_${showReview.productId}`, 'true');
    
    alert('Đã gửi đánh giá thành công!');
    setShowReview(null);
  };
  
  // Hàm xử lý hiển thị chi tiết đơn hàng
  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    document.body.style.overflow = 'hidden'; // Ngăn cuộn trang khi modal hiển thị
  };
  
  // Hàm đóng modal chi tiết đơn hàng
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    document.body.style.overflow = 'auto'; // Cho phép cuộn trang trở lại
  };
  
  // Hàm đóng modal khi click bên ngoài
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeOrderDetails();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Quản lý đơn hàng</h1>
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-lg text-gray-600 mb-4">Bạn chưa có đơn hàng nào.</p>
            <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-semibold text-gray-700">Mã đơn hàng:</span>
                    <span className="ml-2 text-blue-600 font-bold">#{order.id}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status === 'pending' && 'Chờ xác nhận'}
                      {order.status === 'processing' && 'Đang xử lý'}
                      {order.status === 'shipped' && 'Đang giao'}
                      {order.status === 'delivered' && 'Đã giao'}
                      {order.status === 'cancelled' && 'Đã hủy'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.status === 'pending' && 'Đơn hàng của bạn đang chờ xác nhận'}
                      {order.status === 'processing' && 'Đơn hàng đang được chuẩn bị'}
                      {order.status === 'shipped' && 'Đơn hàng đang được giao đến bạn'}
                      {order.status === 'delivered' && 'Đơn hàng đã được giao thành công'}
                      {order.status === 'cancelled' && 'Đơn hàng đã bị hủy'}
                    </span>
                    {order.updatedAt && (
                      <span className="text-xs text-gray-500">
                        Cập nhật: {new Date(order.updatedAt).toLocaleDateString()} 
                        {" "}{new Date(order.updatedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center bg-gray-50 rounded-lg p-2 shadow-sm relative">
                      <Link to={`/product/${item.product.id}`}>
                        <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg mr-3 hover:opacity-80 transition-opacity" />
                      </Link>
                      <div>
                        <Link to={`/product/${item.product.id}`} className="hover:text-blue-600 transition-colors">
                          <div className="font-semibold text-gray-800 hover:underline">{item.product.name}</div>
                        </Link>
                        <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                        <div className="text-sm text-gray-500">Giá: {item.product.price.toLocaleString()} đ</div>
                        {/* Chỉ hiển thị nút đánh giá khi đơn hàng đã giao và sản phẩm chưa được đánh giá */}
                        {order.status === 'delivered' && !hasReviewed(item.product.id) ? (
                          <button
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            onClick={() => handleOpenReview(order.id, item.product.id)}
                          >
                            Đánh giá sản phẩm
                          </button>
                        ) : order.status === 'delivered' && hasReviewed(item.product.id) ? (
                          <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm inline-block">
                            Đã đánh giá
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="text-gray-600 text-sm">
                    <div>Ngày đặt: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</div>
                    <div>Địa chỉ: {order.shippingAddress.address}, {order.shippingAddress.city}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-700">Tổng: {order.total.toLocaleString()} đ</div>
                    <button
                      onClick={() => showOrderDetails(order)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Xem chi tiết đơn hàng
                    </button>
                  </div>
                </div>
                {/* Form đánh giá đẹp mắt */}
                {showReview && showReview.orderId === order.id && (
                  <form onSubmit={handleSubmitReview} className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-blue-100">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-700">Đánh giá sản phẩm</span>
                      <span className="text-gray-500">(Chọn số sao và nhận xét)</span>
                    </div>
                    <div className="mb-4 flex items-center gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill={star <= reviewRating ? '#facc15' : '#e5e7eb'}
                            className="w-8 h-8 transition-colors"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.174 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-yellow-500 font-semibold">{reviewRating} sao</span>
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Nhập nhận xét của bạn..."
                      className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
                      rows={4}
                      required
                    />
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 rounded-xl shadow hover:from-blue-600 hover:to-green-600 transition-all text-lg">Gửi đánh giá</button>
                      <button type="button" className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all text-lg" onClick={() => setShowReview(null)}>Hủy</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Modal chi tiết đơn hàng */}
        {selectedOrder && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
            onClick={handleOutsideClick}
          >
            <div 
              ref={modalRef}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder.id}</h2>
                <button 
                  onClick={closeOrderDetails}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {/* Trạng thái đơn hàng */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Trạng thái đơn hàng</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-800'}`}>
                        {selectedOrder.status === 'pending' && 'Chờ xác nhận'}
                        {selectedOrder.status === 'processing' && 'Đang xử lý'}
                        {selectedOrder.status === 'shipped' && 'Đang giao'}
                        {selectedOrder.status === 'delivered' && 'Đã giao'}
                        {selectedOrder.status === 'cancelled' && 'Đã hủy'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Ngày đặt hàng</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {selectedOrder.updatedAt && (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Cập nhật lần cuối</span>
                      <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleDateString()} {new Date(selectedOrder.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Thông tin sản phẩm */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Sản phẩm</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700">Sản phẩm</th>
                          <th className="px-4 py-3 text-center text-gray-700">Số lượng</th>
                          <th className="px-4 py-3 text-right text-gray-700">Đơn giá</th>
                          <th className="px-4 py-3 text-right text-gray-700">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name} 
                                  className="w-12 h-12 object-cover rounded-md mr-3"
                                />
                                <div>
                                  <div className="font-medium text-gray-800">{item.product.name}</div>
                                  <div className="text-xs text-gray-500">Mã SP: {item.product.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">{item.quantity}</td>
                            <td className="px-4 py-4 text-right">{item.product.price.toLocaleString()} đ</td>
                            <td className="px-4 py-4 text-right font-medium">{(item.product.price * item.quantity).toLocaleString()} đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-semibold">Tổng cộng:</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">{selectedOrder.total.toLocaleString()} đ</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                {/* Thông tin giao hàng */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin giao hàng</h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Người nhận</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                      <p className="font-medium">
                        {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}
                        {selectedOrder.shippingAddress.zipCode && `, ${selectedOrder.shippingAddress.zipCode}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Phần này có thể mở rộng thêm các thông tin khác trong tương lai */}
                
                {/* Nút đóng modal */}
                <div className="mt-6 text-center">
                  <button
                    onClick={closeOrderDetails}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
