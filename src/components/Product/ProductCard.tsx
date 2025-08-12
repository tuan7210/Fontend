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
  const [product, setProduct] = useState(initialProduct);
  
  // Update product when initialProduct changes
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Sử dụng sản phẩm từ props
    const result = addItem(product);
    if (result === false) {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <Link to={`/product/${product.id}`}>
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
        
        <Button
          onClick={handleAddToCart}
          className="w-full"
          disabled={product.stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;