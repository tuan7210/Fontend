import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Smartphone, Laptop, Tablet, Headphones } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useReload } from '../../context/ReloadContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { getItemsCount } = useCart();
  const { reload } = useReload();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Điều hướng đến trang Home với tham số tìm kiếm thay vì trang Search
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      // Khi đến trang Home, chức năng tìm kiếm sẽ được kích hoạt
    }
  };

  const categories = [
    { name: 'Laptops', icon: Laptop, path: '/?category=laptop', categoryName: 'Laptop' },
    { name: 'Phones', icon: Smartphone, path: '/?category=phone', categoryName: 'Phone' },
    { name: 'Tablets', icon: Tablet, path: '/?category=tablet', categoryName: 'Tablet' },
    { name: 'Accessories', icon: Headphones, path: '/?category=accessories', categoryName: 'Accessories' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2"
            onClick={e => {
              if (location.pathname === '/') {
                e.preventDefault();
                reload();
              }
            }}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">TechStore</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors"
              onClick={e => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  reload();
                }
              }}
            >
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-600 transition-colors">
                Danh mục
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {categories.map((category) => {
                  const categorySlug = category.path.split('=')[1];
                  const isActive = categorySlug === queryParams.get('category');
                  
                  return (
                    <Link
                      key={category.name}
                      to={category.path}
                      className={`flex items-center px-4 py-3 ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'} transition-colors`}
                      onClick={(e) => {
                        // Nếu đã ở trang Home và đã chọn danh mục này, chỉ cuộn đến kết quả
                        if (location.pathname === '/' && isActive) {
                          e.preventDefault();
                          const resultsSection = document.getElementById('featured-products');
                          if (resultsSection) {
                            resultsSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                        // Nếu không, để Link xử lý chuyển hướng bình thường
                      }}
                    >
                      <category.icon className="w-5 h-5 mr-3" />
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bạn muốn mua gì hôm nay ?"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {getItemsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemsCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline">{user.name || user.email}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/account"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    Quản lý đơn hàng
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t mt-2 pt-2">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/'); // Chuyển hướng về trang Home sau khi đăng xuất
                      }}
                      className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors font-semibold"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={e => {
                setIsMenuOpen(false);
                if (location.pathname === '/') {
                  e.preventDefault();
                  reload();
                }
              }}
            >
            </Link>
            {categories.map((category) => {
              const categorySlug = category.path.split('=')[1];
              const isActive = categorySlug === queryParams.get('category');
              
              return (
                <Link
                  key={category.name}
                  to={category.path}
                  className={`flex items-center px-3 py-2 ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium rounded-lg' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg'} transition-colors`}
                  onClick={(e) => {
                    // Đóng menu mobile
                    setIsMenuOpen(false);
                    
                    // Nếu đã ở trang Home và đã chọn danh mục này, chỉ cuộn đến kết quả
                    if (location.pathname === '/' && isActive) {
                      e.preventDefault();
                      const resultsSection = document.getElementById('featured-products');
                      if (resultsSection) {
                        resultsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                    // Nếu không, để Link xử lý chuyển hướng bình thường
                  }}
                >
                  <category.icon className="w-5 h-5 mr-3" />
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;