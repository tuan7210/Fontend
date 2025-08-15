import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { stockManager } from '../utils/stockManager';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/Product/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isStockUpdating, setIsStockUpdating] = useState(false);
  
  // State cho phần bình luận và đánh giá (lấy từ backend)
  const [reviews, setReviews] = useState<Array<{
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsStockUpdating(true);
      try {
        // Lấy thông tin chi tiết sản phẩm
        const productData = await productService.getProductById(id);
        if (productData) {
          // Lấy thông tin tồn kho mới nhất từ server
          const updatedStock = await stockManager.syncWithServer(id);
          if (updatedStock !== null) {
            productData.stock = updatedStock;
          }
          setProduct(productData);
          // Lấy sản phẩm liên quan
          const related = await productService.getProductsByCategory(productData.category);
          setRelatedProducts(related.filter(p => p.id !== id).slice(0, 4));
        }
        // Lấy đánh giá từ backend
        if (id) {
          const { reviewService } = await import('../services/reviewService');
          const apiRes = await reviewService.getProductReviews({ productId: Number(id), page: 1, pageSize: 20 });
          // Nếu response là { success, message, data: { reviews, statistics, ... } }
          if (apiRes && 'data' in apiRes && apiRes.data) {
            const { reviews = [], statistics = {} } = apiRes.data as any;
            setReviews(Array.isArray(reviews) ? reviews.map((r: any) => ({
              userName: r.userName,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt
            })) : []);
            setReviewCount(statistics?.totalReviews || 0);
            setAverageRating(statistics?.averageRating || 0);
          } else {
            setReviews([]);
            setReviewCount(0);
            setAverageRating(0);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setIsStockUpdating(false);
      }
    };

    fetchProduct();

    // Subscribe to real-time stock updates
    const unsubscribe = stockManager.subscribe((productId, newStock) => {
      if (productId === id) {
        setProduct(prevProduct => 
          prevProduct ? { ...prevProduct, stock: newStock } : null
        );
      }
    });

    // Tự động làm mới thông tin tồn kho mỗi 60 giây
    const refreshInterval = setInterval(async () => {
      if (id && product) {
        setIsStockUpdating(true);
        try {
          const updatedStock = await stockManager.syncWithServer(id);
          if (updatedStock !== null && product.stock !== updatedStock) {
            setProduct(prevProduct => 
              prevProduct ? { ...prevProduct, stock: updatedStock } : null
            );
          }
        } catch (error) {
        } finally {
          setIsStockUpdating(false);
        }
      }
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [id, product?.id]);

  // ...existing code...

  // State cho đánh giá (di chuyển lên đầu, không đặt sau return)
  // Review state sẽ được kích hoạt khi tích hợp backend review

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center">
        <div className="text-center p-8 rounded-xl shadow-lg bg-white border border-gray-200">
          <h1 className="text-3xl font-extrabold text-red-500 mb-4">Không tìm thấy sản phẩm</h1>
          <Button onClick={() => navigate('/')} className="mt-2 px-6 py-2 text-lg font-semibold bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"> 
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Các chức năng đánh giá được chuyển sang trang OrderHistory để đảm bảo người dùng
  // chỉ có thể đánh giá sản phẩm khi đã mua và nhận hàng thành công

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-2 py-8 md:px-4">
        {/* Chi tiết sản phẩm */}
        <section className="bg-white rounded-2xl shadow-2xl p-8 mb-12 flex flex-col md:flex-row gap-10 border border-blue-100">
          <div className="flex-shrink-0 w-full md:w-1/2 flex items-center justify-center relative">
            <img
              src={product.image}
              alt={product.name}
              className="object-contain h-[28rem] w-full rounded-2xl border-4 border-blue-200 shadow-xl"
            />
            {product.isNew && (
              <span className="absolute top-4 left-4 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-white">Mới</span>
            )}
            {product.isBestSeller && (
              <span className="absolute top-4 right-4 bg-yellow-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-white">Bán chạy</span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 flex items-center gap-4">
                <span className="text-black">{product.name}</span>
                <span className="text-base font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded shadow">{product.brand}</span>
              </h1>
              <div className="flex items-center gap-6 mb-6">
                <span className="text-3xl font-bold text-black">{product.price.toLocaleString()}₫</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through">{product.originalPrice.toLocaleString()}₫</span>
                )}
                <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded shadow">{product.category}</span>
              </div>
              {/* Đánh giá trung bình và số lượng đánh giá từ backend */}
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </span>
                <span className="text-lg text-gray-700 font-semibold">{averageRating.toFixed(1)} / 5</span>
                <span className="text-base text-gray-500">({reviewCount} đánh giá)</span>
              </div>
              <div className="mb-6 flex items-center gap-3">
                <span className="font-semibold text-gray-700">Tình trạng kho:</span>
                <span className={`ml-2 px-3 py-1 rounded text-base font-bold shadow ${isStockUpdating ? 'bg-blue-100 text-blue-700 border border-blue-300' : (product.stock > 0 ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300')}`}>
                  {isStockUpdating 
                    ? 'Đang cập nhật...' 
                    : (product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng')}
                </span>
              </div>
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5v9" /></svg>
                  <span className="font-bold text-xl text-blue-800">Mô tả sản phẩm</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-200 shadow-md">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                    {product.description.split('\n').map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-6">
                  <span className="font-semibold text-black text-lg">Thông số kỹ thuật:</span>
                  <ul className="list-disc ml-8 mt-2 text-black text-base">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key} className="mb-1"><span className="font-semibold text-black">{key}:</span> {value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Controls cho số lượng và nút thêm vào giỏ hàng */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-800 font-medium">Số lượng:</span>
                <div className="flex items-center border-2 border-blue-300 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 bg-gray-100 text-xl font-bold hover:bg-gray-200 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 bg-gray-100 text-xl font-bold hover:bg-gray-200 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <span className={`ml-4 text-sm ${isStockUpdating ? 'text-blue-500' : ''}`}>
                  {isStockUpdating ? 'Đang cập nhật...' : (
                    product.stock > 0 
                      ? `${product.stock} sản phẩm có sẵn` 
                      : 'Hết hàng'
                  )}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Button 
                  onClick={() => {
                    if (product.stock < quantity) {
                      // Không cho thêm nếu vượt quá tồn kho, không hiện alert
                      return;
                    }
                    const success = addItem(product, quantity);
                    if (success) {
                      alert('Đã thêm sản phẩm vào giỏ hàng!');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="w-full text-lg font-bold py-3 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
                  disabled={product.stock === 0 || isStockUpdating}
                >
                  <ShoppingCart size={20} />
                  {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                </Button>
                <Button
                  onClick={() => {
                    if (product.stock < quantity) return;
                    const success = addItem(product, quantity);
                    if (success) {
                      navigate('/cart');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="w-full text-lg font-bold py-3 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl shadow hover:bg-green-600 transition"
                  disabled={product.stock === 0 || isStockUpdating}
                >
                  Mua ngay
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Sản phẩm liên quan */}
        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-8 text-blue-800">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
        
        {/* Đánh giá & Bình luận */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-blue-800">Đánh giá & Bình luận</h2>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            {/* Thông báo về quy tắc đánh giá */}
            <div className="mb-10 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-xl font-bold text-blue-700 mb-2">Đánh giá sản phẩm</h3>
              <p className="text-gray-600">
                Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công. 
                Mỗi sản phẩm chỉ được đánh giá một lần. Vui lòng vào trang 
                <a href="/order-history" className="text-blue-600 hover:underline mx-1">Quản lý đơn hàng</a>
                để đánh giá các sản phẩm đã mua.
              </p>
            </div>
            {/* Danh sách các bình luận từ backend */}
            <div>
              <h3 className="text-xl font-bold text-blue-700 mb-4">
                {reviewCount > 0 ? `Bình luận (${reviewCount})` : 'Chưa có bình luận nào'}
              </h3>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Hãy là người đầu tiên bình luận về sản phẩm này!</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;