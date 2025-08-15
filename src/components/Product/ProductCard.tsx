import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import Button from '../UI/Button';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product: initialProduct }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Xử lý mua ngay: thêm vào giỏ và chuyển hướng đến cart
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    const result = addItem(product);
    if (result === false) {
      navigate('/login');
    } else {
      navigate('/cart');
    }
  };
  const [product, setProduct] = useState(initialProduct);
  const [imageError, setImageError] = useState(false);
  
  // Update product when initialProduct changes
  useEffect(() => {
    setProduct(initialProduct);
    setImageError(false);
  }, [initialProduct]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Sử dụng sản phẩm từ props
    const result = addItem(product);
    if (result === false) {
      navigate('/login');
    }
  };

  // Add cache busting to image URL to ensure fresh images
  const getImageUrlWithCacheBuster = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl; // Base64 images don't need cache busting
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${imageUrl}${separator}t=${timestamp}&r=${random}&nocache=true`;
  };

  const handleImageError = () => {
    console.log(`Image failed to load for product ${product.name}:`, product.image);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`Image loaded successfully for product ${product.name}:`, product.image);
    setImageError(false);
  };

  const fallbackImage = 'https://via.placeholder.com/300x200/e2e8f0/64748b?text=No+Image';
  const displayImage = imageError ? fallbackImage : getImageUrlWithCacheBuster(product.image || fallbackImage);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <Link to={`/product/${product.id}`}>
        <div className="relative">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {product.isNew && (
            <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
              Best Seller
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-600 text-sm ml-2">({product.reviews})</span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-800">{product.price.toLocaleString()} đ</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">{product.originalPrice.toLocaleString()} đ</span>
            )}
          </div>
          <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} trong kho` : 'Hết hàng'}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            className="w-1/2 min-w-[90px] px-2"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
          </Button>
          <Button
            className="w-1/2 min-w-[90px] px-2 bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-green-600 shadow-md"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
          >
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;