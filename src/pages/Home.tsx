import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone, TrendingUp, Star, X, Laptop, Tablet, Headphones } from 'lucide-react';
import { Product } from '../types';
import { productService } from '../services/productService';
import ProductCard from '../components/Product/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { useReload } from '../context/ReloadContext';

const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Lấy tham số tìm kiếm từ URL (nếu có)
  const searchFromURL = queryParams.get('search') || '';
  const categoryFromURL = queryParams.get('category') || '';
  
  // State cho form lọc
  const [searchInput, setSearchInput] = useState(searchFromURL);
  const [minPriceInput, setMinPriceInput] = useState(queryParams.get('minPrice') || '');
  const [maxPriceInput, setMaxPriceInput] = useState(queryParams.get('maxPrice') || '');
  const [brandInput, setBrandInput] = useState(queryParams.get('brand') || '');
  const [ratingInput, setRatingInput] = useState(queryParams.get('rating') || '');
  const [inStockInput, setInStockInput] = useState(queryParams.get('inStock') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(!!searchFromURL || !!categoryFromURL); // Kích hoạt tìm kiếm nếu có tham số từ URL
  const [sortBy, setSortBy] = useState('popular'); // popular, newest, price-asc, price-desc
  const [error, setError] = useState<string | null>(null);

  // Scroll đến kết quả tìm kiếm
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useReload();
  
  // Cập nhật isSearchActive khi categoryFromURL thay đổi
  useEffect(() => {
    setIsSearchActive(!!searchFromURL || !!categoryFromURL);
  }, [categoryFromURL, searchFromURL]);

  // Tải và hiển thị sản phẩm
  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      let productResults = [];
      
      if (categoryFromURL) {
        // Nếu có tham số danh mục, tải sản phẩm theo danh mục
        productResults = await productService.getProductsByCategory(categoryFromURL);
      } else {
        // Ngược lại tải tất cả sản phẩm với tham số mặc định
        const response = await productService.getProducts({ pageSize: 100 });
        productResults = response.items;
      }
      
      setProducts(productResults);
    } catch (error) {
      setError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = subscribe(() => {
      // Gọi lại fetchProducts khi có sự kiện reload
      fetchProducts();
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    fetchProducts();
    
    // Nếu có tham số tìm kiếm hoặc danh mục, cuộn đến phần kết quả
    if ((isSearchActive || categoryFromURL) && searchResultsRef.current) {
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [categoryFromURL, isSearchActive]);

  const newProducts = products.filter(p => p.isNew).slice(0, 4);

  // Lấy danh sách brand từ products
  const brandOptions = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  // Lọc sản phẩm theo các tiêu chí
  const filteredProducts = products.filter(p => {
    if (searchInput && !p.name.toLowerCase().includes(searchInput.toLowerCase())) return false;
    if (categoryFromURL && !p.category.toLowerCase().includes(categoryFromURL.toLowerCase())) return false;
    if (minPriceInput && p.price < Number(minPriceInput)) return false;
    if (maxPriceInput && p.price > Number(maxPriceInput)) return false;
    if (brandInput && p.brand !== brandInput) return false;
    if (ratingInput && Math.round(p.rating) < Number(ratingInput)) return false;
    if (inStockInput === 'true' && p.stock === 0) return false;
    if (inStockInput === 'false' && p.stock > 0) return false;
    return true;
  });
  
  // Sắp xếp sản phẩm
  const sortedProducts = [...filteredProducts];
  if (sortBy === 'newest') {
    sortedProducts.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });
  } else if (sortBy === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    sortedProducts.sort((a, b) => b.rating - a.rating);
  }
  
  // Hàm xử lý khi nhấn tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchActive(true);
    
    // Scroll đến phần kết quả tìm kiếm
    setTimeout(() => {
      searchResultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Hàm xóa bộ lọc
  const resetFilters = async () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setBrandInput('');
    setRatingInput('');
    setInStockInput('');
    
    // Xóa tham số URL category
    if (categoryFromURL || searchFromURL) {
      setLoading(true);
      
      // Cập nhật URL không có tham số tìm kiếm và danh mục
      const updatedSearchParams = new URLSearchParams(location.search);
      if (categoryFromURL) updatedSearchParams.delete('category');
      if (searchFromURL) updatedSearchParams.delete('search');
      navigate(`/?${updatedSearchParams.toString()}`, { replace: true });
      
      try {
        // Tải lại tất cả sản phẩm
        const response = await productService.getProducts({ pageSize: 100 });
        
        setProducts(response.items);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
    
    setIsSearchActive(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
  {/* ...existing code... */}

      {/* Hero Section - Cải tiến với bố cục 2 cột và hiệu ứng */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white py-16 md:py-20 lg:py-24 relative overflow-hidden">
        {/* Hiệu ứng hình học nền */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-overlay blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in">
                Khám phá <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400">công nghệ</span> mới nhất
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
                Từ laptop hiện đại đến smartphone mới nhất, TechStore cung cấp những sản phẩm tốt nhất với giá cả cạnh tranh nhất.
              </p>
              <div className="flex">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 shadow-xl border-0 px-10 py-4 font-bold text-lg relative overflow-hidden group transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    // Cuộn xuống phần sản phẩm
                    // Nếu đang trong chế độ tìm kiếm, tắt tìm kiếm để hiển thị sản phẩm nổi bật
                    if (isSearchActive) {
                      setIsSearchActive(false);
                      // Đặt thời gian chờ ngắn để DOM cập nhật trước khi cuộn
                      setTimeout(() => {
                        const featuredProductsSection = document.getElementById('featured-products');
                        featuredProductsSection?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      // Nếu không trong chế độ tìm kiếm, chỉ cần cuộn xuống
                      const featuredProductsSection = document.getElementById('featured-products');
                      featuredProductsSection?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="relative z-10 flex items-center">
                    Mua ngay
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 w-full h-full bg-white opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></span>
                </Button>
              </div>
            </div>
            
            {/* Ảnh/Banner nổi bật */}
            <div className="w-full md:w-2/5 mt-8 md:mt-0 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-70 transform -rotate-6"></div>
                <div className="relative bg-gradient-to-tr from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Sản phẩm nổi bật</h3>
                    <div className="bg-blue-600/20 h-1 w-16 mx-auto rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.filter(p => p.isBestSeller).slice(0, 4).map((p) => (
                      <div key={p.id} className="bg-gray-800/60 p-3 rounded-lg hover:bg-gray-700/60 transition flex flex-col items-center">
                        <img src={p.image} alt={p.name} className="w-full h-24 object-contain mb-2" />
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-blue-400 font-bold">{p.price.toLocaleString()}₫</p>
                        <button
                          className="mt-2 px-4 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-full shadow transition"
                          onClick={() => window.location.href = `/product/${p.id}`}
                        >
                          Mua ngay
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Bộ lọc và tìm kiếm sản phẩm - Cải tiến thiết kế */}
      <section className="container mx-auto px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4 border border-blue-100 transform -translate-y-2 relative z-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-800">Tìm kiếm thông minh</h2>
              </div>
              <span className="text-sm text-gray-500">Tìm thấy <strong className="text-blue-600">{filteredProducts.length}</strong> sản phẩm</span>
            </div>          <form
            onSubmit={handleSearch}
            className="relative"
          >
            {/* Tìm kiếm chính */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Bạn đang tìm sản phẩm gì?"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                Tìm kiếm
              </Button>
            </div>
            
            {/* Bộ lọc mở rộng */}
            {categoryFromURL && (
              <div className="mb-6 flex items-center justify-between bg-blue-50 px-6 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  {categoryFromURL === 'laptop' && <Laptop className="w-5 h-5 mr-2 text-blue-600" />}
                  {categoryFromURL === 'phone' && <Smartphone className="w-5 h-5 mr-2 text-blue-600" />}
                  {categoryFromURL === 'tablet' && <Tablet className="w-5 h-5 mr-2 text-blue-600" />}
                  {categoryFromURL === 'accessories' && <Headphones className="w-5 h-5 mr-2 text-blue-600" />}
                  <span className="text-sm text-blue-700">Đang xem danh mục: <span className="font-semibold">{categoryFromURL.charAt(0).toUpperCase() + categoryFromURL.slice(1)}</span></span>
                </div>
                <button 
                  className="text-blue-600 hover:text-blue-800 flex items-center" 
                  onClick={resetFilters}
                >
                  <span className="mr-1 text-sm">Xóa bộ lọc</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Khoảng giá</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={minPriceInput}
                    onChange={e => setMinPriceInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                    min={0}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={maxPriceInput}
                    onChange={e => setMaxPriceInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                    min={0}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                <select
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brandOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Đánh giá</label>
                <select
                  value={ratingInput}
                  onChange={e => setRatingInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="">Tất cả đánh giá</option>
                  {[5,4,3,2,1].map(r => (
                    <option key={r} value={r}>{r} sao trở lên</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tình trạng kho</label>
                <select
                  value={inStockInput}
                  onChange={e => setInStockInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                >
                  <option value="">Tất cả tình trạng</option>
                  <option value="true">Còn hàng</option>
                  <option value="false">Hết hàng</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Kết quả tìm kiếm - Hiển thị khi người dùng tìm kiếm */}
      {isSearchActive && (
        <section id="featured-products" className="py-10 md:py-14 lg:py-16" ref={searchResultsRef}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                  style={{
                    background: categoryFromURL ? 
                      'linear-gradient(to right, #3b82f6, #60a5fa)' : 
                      '#EBF5FF'
                  }}
                >
                  {categoryFromURL === 'laptop' && <Laptop className="w-5 h-5 text-white" />}
                  {categoryFromURL === 'phone' && <Smartphone className="w-5 h-5 text-white" />}
                  {categoryFromURL === 'tablet' && <Tablet className="w-5 h-5 text-white" />}
                  {categoryFromURL === 'accessories' && <Headphones className="w-5 h-5 text-white" />}
                  {!categoryFromURL && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {categoryFromURL ? `Sản phẩm ${categoryFromURL.charAt(0).toUpperCase() + categoryFromURL.slice(1)}` : 'Kết quả tìm kiếm'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Tìm thấy {sortedProducts.length} sản phẩm 
                    {searchInput ? ` cho "${searchInput}"` : ''}
                    {categoryFromURL ? ` trong danh mục "${categoryFromURL.charAt(0).toUpperCase() + categoryFromURL.slice(1)}"` : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" /> Xóa bộ lọc
                </button>
                <select 
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Phổ biến</option>
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá: Thấp → Cao</option>
                  <option value="price-desc">Giá: Cao → Thấp</option>
                  <option value="rating">Đánh giá cao</option>
                </select>
              </div>
            </div>
            
            {error ? (
              // Hiển thị thông báo lỗi
              <div className="bg-white rounded-xl shadow-md p-10 border border-red-100 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-red-500 text-xl font-semibold mb-2">Đã xảy ra lỗi khi tải dữ liệu</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </button>
              </div>
            ) : sortedProducts.length === 0 ? (
              // Hiển thị khi không có sản phẩm nào
              <div className="bg-white rounded-xl shadow-md p-10 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-gray-700 text-xl font-semibold mb-2">Không tìm thấy sản phẩm nào phù hợp</div>
                <p className="text-gray-600 mb-6">Vui lòng thử lại với các bộ lọc khác hoặc từ khóa tìm kiếm khác</p>
                <button 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              // Hiển thị danh sách sản phẩm
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Products - Hiển thị khi không tìm kiếm */}
      {!isSearchActive && (
        <section id="featured-products" className="py-10 md:py-14 lg:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">Sản phẩm nổi bật</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.filter(p => p.isBestSeller || p.isNew).slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-10 md:py-14 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold">Hàng mới về</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 md:py-14 lg:py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="rounded-xl bg-gray-800 p-6 shadow">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-blue-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">10,000+</h3>
              <p className="text-gray-400">Khách hàng hài lòng</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6 shadow">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-10 h-10 md:w-12 md:h-12 text-yellow-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">4.9/5</h3>
              <p className="text-gray-400">Đánh giá khách hàng</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6 shadow">
              <div className="flex items-center justify-center mb-4">
                <Smartphone className="w-10 h-10 md:w-12 md:h-12 text-green-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">1,000+</h3>
              <p className="text-gray-400">Sản phẩm có sẵn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-10 md:py-14 lg:py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Nhận thông tin mới nhất</h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 opacity-90">
            Nhận ưu đãi và cập nhật sản phẩm mới qua email của bạn
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100 rounded-l-none">
              Đăng ký nhận tin
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;