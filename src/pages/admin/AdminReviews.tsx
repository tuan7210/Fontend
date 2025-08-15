import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  User, 
  Calendar, 
  Package, 
  Search,
  Filter,
  ArrowLeft,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';

type Review = {
  reviewId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
};

type Product = {
  productId: number;
  name: string;
  imageUrl: string;
};

// ...existing code...

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => {
  const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const ProductReviewManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ totalReviews: number; averageRating: number } | null>(null);

  // Lấy danh sách sản phẩm (chỉ id, name, imageUrl)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5032/api/Product?pageNumber=1&pageSize=30&search=${encodeURIComponent(searchTerm)}`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data.items)) {
          setProducts(data.data.items.map((p: any) => ({
            productId: p.productId,
            name: p.name,
            imageUrl: p.imageUrl
          })));
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTerm]);

  // Lấy review khi chọn sản phẩm
  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5032/api/ProductReview/product/${product.productId}?page=1&pageSize=50`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data.reviews)) {
        setReviews(data.data.reviews.map((r: any) => ({
          reviewId: r.reviewId,
          userName: r.userName,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          isVerified: r.isVerified ?? true // fallback true nếu không có trường này
        })));
        setReviewStats({
          totalReviews: data.data.statistics?.totalReviews || 0,
          averageRating: data.data.statistics?.averageRating || 0
        });
      } else {
        setReviews([]);
        setReviewStats(null);
      }
    } catch {
      setReviews([]);
      setReviewStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Ẩn/hiện review (duyệt/ẩn)
  const toggleReviewVisibility = async (reviewId: number, isVerified: boolean) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5032/api/ProductReview/${reviewId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ isVerified })
    });
    // Refresh reviews
    if (selectedProduct) handleSelectProduct(selectedProduct);
  };

  // Xóa review
  const deleteReview = async (reviewId: number) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5032/api/ProductReview/${reviewId}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    // Refresh reviews
    if (selectedProduct) handleSelectProduct(selectedProduct);
  };

  const getFilteredReviews = () => {
    let filtered = reviews.filter(review => {
      if (!showHidden && !review.isVerified) return false;
      if (filterRating && review.rating !== filterRating) return false;
      return true;
    });
    return filtered;
  };

  if (selectedProduct) {
    const filteredReviews = getFilteredReviews();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
            <div className="w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex items-center text-violet-600 hover:text-violet-800 mb-4 font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại danh sách sản phẩm
              </button>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
                <div className="flex items-start space-x-6">
                  <img
                    src={
                      selectedProduct.imageUrl && selectedProduct.imageUrl.trim() !== ''
                        ? (selectedProduct.imageUrl.startsWith('http')
                            ? selectedProduct.imageUrl
                            : `http://localhost:5032/api/Product/image/${selectedProduct.imageUrl}`)
                        : '/no-image.png'
                    }
                    alt={selectedProduct.name}
                    className="w-24 h-24 rounded-xl object-cover shadow-md bg-gray-100"
                    onError={e => { (e.target as HTMLImageElement).src = '/no-image.png'; }}
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedProduct.name}</h1>
                    {/* Chỉ hiển thị tên sản phẩm và hình ảnh */}
                    <div className="flex items-center space-x-4 mb-3"></div>
                    {reviewStats && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <StarRating rating={reviewStats.averageRating} size="lg" />
                          <span className="text-lg font-semibold text-slate-900">
                            {reviewStats.averageRating}
                          </span>
                        </div>
                        <span className="text-slate-600">
                          ({reviewStats.totalReviews} đánh giá)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-slate-600" />
                    <span className="font-semibold text-slate-900">Lọc theo:</span>
                  </div>
                  
                  <select
                    value={filterRating || ''}
                    onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/80"
                  >
                    <option value="">Tất cả đánh giá</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                  </select>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Hiện đánh tất cả đánh giá</span>
                </label>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {filteredReviews.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-xl text-slate-500 mb-2">Không có đánh giá nào</p>
                    <p className="text-slate-400">Chưa có khách hàng nào đánh giá sản phẩm này</p>
                  </div>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.reviewId} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">{review.userName}</h4>
                          {/* Không còn userEmail */}
                          <div className="flex items-center space-x-3">
                            <StarRating rating={review.rating} size="lg" />
                            <span className="text-slate-500 text-sm flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          review.isVerified 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {review.isVerified ? 'Hiển thị' : 'đã ẩn'}
                        </div>
                        <button
                          onClick={() => toggleReviewVisibility(review.reviewId, !review.isVerified)}
                          className={`p-2 rounded-xl transition-all duration-200 ${
                            review.isVerified
                              ? 'text-amber-600 hover:bg-amber-100'
                              : 'text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={review.isVerified ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                        >
                          {review.isVerified ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => deleteReview(review.reviewId)}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-all duration-200"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-slate-700 leading-relaxed">{review.comment}</p>
                    </div>

                    <div className="flex items-center justify-end text-sm text-slate-500">
                      <span>ID: {review.reviewId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
          <div className="w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
          <div className="w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
                Quản lý Đánh giá Sản phẩm
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Quản lý và kiểm duyệt đánh giá của khách hàng về các sản phẩm
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white/80"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.productId} className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="relative">
                    <img
                      src={
                        product.imageUrl && product.imageUrl.trim() !== ''
                          ? (product.imageUrl.startsWith('http')
                              ? product.imageUrl
                              : `http://localhost:5032/api/Product/image/${product.imageUrl}`)
                          : '/no-image.png'
                      }
                      alt={product.name}
                      className="w-full h-48 object-cover bg-gray-100"
                      onError={e => { (e.target as HTMLImageElement).src = '/no-image.png'; }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-violet-700"
                        onClick={() => handleSelectProduct(product)}
                    >
                      {product.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewManagement;