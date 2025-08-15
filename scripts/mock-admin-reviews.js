// Thêm mock sản phẩm và đánh giá vào localStorage để admin có thể test chức năng quản lý đánh giá
// Chạy file này 1 lần trong môi trường trình duyệt (hoặc copy vào console)

(function() {
  const products = [
    {
      id: 'p1',
      name: 'iPhone 15 Pro Max',
      price: 32990000,
      originalPrice: 35990000,
      image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Phone',
      brand: 'Apple',
      description: 'Flagship iPhone 2025',
      specifications: { color: 'Black', storage: '256GB' },
      stock: 10,
      rating: 4.8,
      reviews: 2,
      isNew: true,
      isBestSeller: true
    },
    {
      id: 'p2',
      name: 'MacBook Pro M3',
      price: 49990000,
      originalPrice: 52990000,
      image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Laptop',
      brand: 'Apple',
      description: 'MacBook Pro 2025',
      specifications: { color: 'Silver', ram: '32GB' },
      stock: 5,
      rating: 4.9,
      reviews: 1,
      isNew: true,
      isBestSeller: false
    },
    {
      id: 'p3',
      name: 'Samsung Galaxy Tab S9',
      price: 18990000,
      originalPrice: 20990000,
      image: 'https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'Tablet',
      brand: 'Samsung',
      description: 'Android flagship tablet',
      specifications: { color: 'Gray', storage: '128GB' },
      stock: 8,
      rating: 4.7,
      reviews: 0,
      isNew: false,
      isBestSeller: false
    }
  ];

  const reviews = [
    {
      reviewId: 1,
      userId: 101,
      userName: 'Nguyen Van A',
      userEmail: 'a@example.com',
      productId: 'p1',
      productName: 'iPhone 15 Pro Max',
      productBrand: 'Apple',
      productImageUrl: products[0].image,
      orderItemId: 1,
      orderId: 1001,
      rating: 5,
      comment: 'Sản phẩm rất tốt, giao hàng nhanh!',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderStatus: 'delivered'
    },
    {
      reviewId: 2,
      userId: 102,
      userName: 'Le Thi B',
      userEmail: 'b@example.com',
      productId: 'p1',
      productName: 'iPhone 15 Pro Max',
      productBrand: 'Apple',
      productImageUrl: products[0].image,
      orderItemId: 2,
      orderId: 1002,
      rating: 4,
      comment: 'Đẹp, pin trâu nhưng giá hơi cao.',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderStatus: 'delivered'
    },
    {
      reviewId: 3,
      userId: 103,
      userName: 'Tran Van C',
      userEmail: 'c@example.com',
      productId: 'p2',
      productName: 'MacBook Pro M3',
      productBrand: 'Apple',
      productImageUrl: products[1].image,
      orderItemId: 3,
      orderId: 1003,
      rating: 5,
      comment: 'Máy mạnh, màn đẹp, pin lâu.',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderStatus: 'delivered'
    }
  ];

  localStorage.setItem('mockProducts', JSON.stringify(products));
  localStorage.setItem('mockReviews', JSON.stringify(reviews));
  alert('Đã thêm mock sản phẩm và đánh giá vào localStorage!');
})();
