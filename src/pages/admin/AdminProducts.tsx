import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import { stockManager } from '../../utils/stockManager';
import Button from '../../components/UI/Button';

import { Product } from '../../types';

// Định nghĩa interface cho Category từ API
interface Category {
  categoryId: number;
  name: string;
  description: string;
}

const AdminProducts: React.FC = () => {
  // Trạng thái của danh sách sản phẩm
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Trạng thái cho bộ lọc
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [brand, setBrand] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Danh sách danh mục và thương hiệu
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Trạng thái cho modal chỉnh sửa/thêm mới
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Trạng thái cho specifications
  const [specificationKeys, setSpecificationKeys] = useState<string[]>([]);
  const [specificationValues, setSpecificationValues] = useState<string[]>([]);

  // Thông báo
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Xử lý file ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Tải các danh mục và thương hiệu
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Initialize stockManager to load cached data
        stockManager.init();
        
        const [categoriesResponse, brandsResponse] = await Promise.all([
          productService.getCategories(),
          productService.getBrands()
        ]);
        
        setCategories(categoriesResponse);
        setBrands(brandsResponse);
      } catch (error) {
        setErrorMsg('Không thể tải danh mục và thương hiệu. Vui lòng thử lại sau.');
      }
    };
    
    loadMasterData();
  }, []);

  // Tải sản phẩm với phân trang
  const loadProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await productService.getProducts({
        pageNumber,
        pageSize,
        search: search || undefined,
        categoryId: categoryId,
        brand: brand,
        minPrice: minPrice,
        maxPrice: maxPrice,
        inStock: inStock,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      // Apply cached stock from stockManager
      const productsWithCachedStock = response.items.map(product => {
        const cachedStock = stockManager.getCachedStock(product.id);
        return cachedStock !== null 
          ? { ...product, stock: cachedStock }
          : product;
      });
      
      setProducts(productsWithCachedStock);
      setTotalCount(response.totalCount);
      
      // Tính toán số trang
      const calculatedTotalPages = Math.ceil(response.totalCount / pageSize);
      setTotalPages(calculatedTotalPages);
      
    } catch (error) {
      setErrorMsg('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Tải lại sản phẩm khi các tham số thay đổi
  useEffect(() => {
    loadProducts();
  }, [pageNumber, pageSize, sortBy, sortOrder]);

  // Hàm tìm kiếm với debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProducts();
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [search, categoryId, brand, minPrice, maxPrice, inStock]);

  // Subscribe to stock changes from customer orders
  useEffect(() => {
    const unsubscribe = stockManager.subscribe((productId, newStock) => {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, stock: newStock }
            : product
        )
      );
    });

    return unsubscribe;
  }, []);

  // Apply cached stock when products change
  useEffect(() => {
    if (products.length > 0) {
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const cachedStock = stockManager.getCachedStock(product.id);
          return cachedStock !== null 
            ? { ...product, stock: cachedStock }
            : product;
        })
      );
    }
  }, []);

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Kiểm tra loại file
    if (!file.type.match('image.*')) {
      setErrorMsg('Vui lòng chọn file ảnh');
      return;
    }
    
    // Giới hạn kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Kích thước file không được vượt quá 5MB');
      return;
    }
    
    setSelectedFile(file);
    setErrorMsg('');
    
    // Set the file in editingProduct and clear imageUrl
    if (editingProduct) {
      setEditingProduct({...editingProduct, file: file, imageUrl: ''});
    }
    
    // Tạo URL xem trước ảnh
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Lưu ý: Chức năng chuyển đổi file thành base64 được xử lý trực tiếp trong handleSaveProduct

  // Xử lý thêm specifications
  const addSpecification = () => {
    setSpecificationKeys([...specificationKeys, '']);
    setSpecificationValues([...specificationValues, '']);
  };

  const updateSpecificationKey = (index: number, value: string) => {
    const newKeys = [...specificationKeys];
    newKeys[index] = value;
    setSpecificationKeys(newKeys);
  };

  const updateSpecificationValue = (index: number, value: string) => {
    const newValues = [...specificationValues];
    newValues[index] = value;
    setSpecificationValues(newValues);
  };

  const removeSpecification = (index: number) => {
    const newKeys = [...specificationKeys];
    const newValues = [...specificationValues];
    newKeys.splice(index, 1);
    newValues.splice(index, 1);
    setSpecificationKeys(newKeys);
    setSpecificationValues(newValues);
  };

  // Xử lý khi mở modal tạo mới
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      brand: '',
      stockQuantity: 0,
      categoryId: categories[0]?.categoryId || 1,
      imageUrl: '',
      specifications: '{}',
      isNew: false,
      isBestSeller: false
    });
    setSpecificationKeys([]);
    setSpecificationValues([]);
    setSelectedFile(null);
    setPreviewUrl('');
    setShowModal(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Xử lý khi mở modal chỉnh sửa
  const handleOpenEditModal = async (productId: string) => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      // Lấy chi tiết sản phẩm từ API
      const product = await productService.getProductById(productId);
      
      if (!product) {
        throw new Error('Không thể tìm thấy thông tin sản phẩm.');
      }
      
      setModalMode('edit');
      
      // Parse specifications từ sản phẩm
      let specs: Record<string, string> = product.specifications || {};
      
      const specKeys = Object.keys(specs);
      const specValues = Object.values(specs);
      
      setSpecificationKeys(specKeys);
      setSpecificationValues(specValues);
      
      // Map dữ liệu từ product model của frontend sang model backend
      setEditingProduct({
        productId: Number(product.id),
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        brand: product.brand,
        stockQuantity: product.stock,
        categoryId: categories.find(c => c.name === product.category)?.categoryId || 1,
        imageUrl: product.image,
        specifications: JSON.stringify(specs),
        isNew: !!product.isNew,
        isBestSeller: !!product.isBestSeller
      });
      
      setShowModal(true);
      
    } catch (error) {
      setErrorMsg('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lưu sản phẩm
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      // Tạo specifications từ các key và value
      const specs: Record<string, string> = {};
      specificationKeys.forEach((key, index) => {
        if (key.trim()) {
          specs[key.trim()] = specificationValues[index] || '';
        }
      });
      
      // Cập nhật specifications trong editingProduct
      const updatedProduct = {
        ...editingProduct,
        specifications: JSON.stringify(specs)
      };
      
      if (modalMode === 'create') {
        // Gọi API tạo sản phẩm mới
        await productService.createProduct({
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: Number(updatedProduct.price),
          originalPrice: Number(updatedProduct.originalPrice || 0),
          brand: updatedProduct.brand,
          stock: Number(updatedProduct.stockQuantity),
          categoryId: Number(updatedProduct.categoryId),
          image: updatedProduct.imageUrl,
          specifications: specs,
          isNew: updatedProduct.isNew,
          isBestSeller: updatedProduct.isBestSeller,
          file: updatedProduct.file
        });
        
        setSuccessMsg('Tạo sản phẩm mới thành công!');
      } else {
        // Gọi API cập nhật sản phẩm
        await productService.updateProduct(String(updatedProduct.productId), {
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: Number(updatedProduct.price),
          originalPrice: Number(updatedProduct.originalPrice || 0),
          brand: updatedProduct.brand,
          stock: Number(updatedProduct.stockQuantity),
          categoryId: Number(updatedProduct.categoryId),
          image: updatedProduct.imageUrl,
          specifications: specs,
          isNew: updatedProduct.isNew,
          isBestSeller: updatedProduct.isBestSeller,
          file: updatedProduct.file
        });
        
        // Notify stockManager về stock update
        stockManager.updateStockAndNotify(String(updatedProduct.productId), Number(updatedProduct.stockQuantity));
        
        // Lưu vào localStorage để persist data
        try {
          const localUpdates = JSON.parse(localStorage.getItem('stockUpdates') || '{}');
          localUpdates[String(updatedProduct.productId)] = {
            stock: Number(updatedProduct.stockQuantity),
            timestamp: Date.now()
          };
          localStorage.setItem('stockUpdates', JSON.stringify(localUpdates));
        } catch (error) {
        }
        
        setSuccessMsg('Cập nhật sản phẩm thành công!');
      }
      
      // Reload sản phẩm sau khi tạo/cập nhật
      await loadProducts();
      
      // Đóng modal sau khi hiển thị thông báo thành công
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
      
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể lưu sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  // Xử lý xóa sản phẩm
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      await productService.deleteProduct(productId);
      setSuccessMsg('Xóa sản phẩm thành công!');
      
      // Reload sản phẩm sau khi xóa
      await loadProducts();
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      
    } catch (error) {
      setErrorMsg('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý cập nhật kho hàng nhanh
  const handleQuickStockUpdate = async (productId: string, currentStock: number) => {
    const newStock = prompt(`Cập nhật tồn kho cho sản phẩm (hiện tại: ${currentStock}):`, currentStock.toString());
    
    if (newStock === null || newStock === currentStock.toString()) return;
    
    const stockNumber = parseInt(newStock);
    if (isNaN(stockNumber) || stockNumber < 0) {
      setErrorMsg('Số lượng tồn kho phải là số nguyên dương.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      await productService.updateProduct(productId, {
        stock: stockNumber
      });
      
      // Notify stockManager về stock update
      stockManager.updateStockAndNotify(productId, stockNumber);
      
      // Lưu vào localStorage để persist data
      try {
        const localUpdates = JSON.parse(localStorage.getItem('stockUpdates') || '{}');
        localUpdates[productId] = {
          stock: stockNumber,
          timestamp: Date.now()
        };
        localStorage.setItem('stockUpdates', JSON.stringify(localUpdates));
      } catch (error) {
      }
      
      setSuccessMsg(`Cập nhật tồn kho thành công! (${currentStock} → ${stockNumber})`);
      
      // Reload sản phẩm sau khi cập nhật
      await loadProducts();
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      
    } catch (error) {
      setErrorMsg('Không thể cập nhật tồn kho. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Reset filter
  const resetFilters = () => {
    setSearch('');
    setCategoryId(undefined);
    setBrand(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStock(undefined);
    setSortBy('name');
    setSortOrder('asc');
    setPageNumber(1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Tiêu đề và nút tạo mới */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Quản lý sản phẩm
        </h1>
        <div className="flex gap-3">
          <Button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={handleOpenCreateModal}
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Còn hàng</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.stock > 10).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sắp hết</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.stock > 0 && p.stock <= 10).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hết hàng</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p.stock === 0).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Thông báo */}
      {products.filter(p => p.stock <= 10 && p.stock > 0).length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
          <strong>Cảnh báo:</strong> Có {products.filter(p => p.stock <= 10 && p.stock > 0).length} sản phẩm sắp hết hàng (≤ 10 sản phẩm).
        </div>
      )}
      {products.filter(p => p.stock === 0).length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <strong>Hết hàng:</strong> Có {products.filter(p => p.stock === 0).length} sản phẩm đã hết hàng.
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
          {successMsg}
        </div>
      )}

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên sản phẩm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <select
            value={categoryId?.toString() || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={brand || ''}
            onChange={(e) => setBrand(e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            value={inStock === undefined ? '' : String(inStock)}
            onChange={(e) => {
              const value = e.target.value;
              setInStock(value === '' ? undefined : value === 'true');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Còn hàng</option>
            <option value="false">Hết hàng</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Giá tối thiểu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="number"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Giá tối đa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap">Sắp xếp theo:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Tên sản phẩm</option>
              <option value="price">Giá</option>
              <option value="rating">Đánh giá</option>
              <option value="created_at">Ngày tạo</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2"
              onClick={resetFilters}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      </div>
      {/* Bảng sản phẩm */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="py-3 px-4 text-left">Sản phẩm</th>
                <th className="py-3 px-4 text-left">Danh mục</th>
                <th className="py-3 px-4 text-left">Thương hiệu</th>
                <th className="py-3 px-4 text-right">Giá (đ)</th>
                <th className="py-3 px-4 text-center">Tồn kho</th>
                <th className="py-3 px-4 text-center">Đánh giá</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full border-b-2 border-blue-600 w-8 h-8"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        
                        <div>
                          <div className="font-medium text-gray-800">{product.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{product.category}</td>
                    <td className="py-3 px-4 text-gray-600">{product.brand}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {product.price.toLocaleString()}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {product.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          <div className="font-medium">{product.stock}</div>
                          <div className="text-xs">
                            {product.stock > 10 ? (
                              <span className="text-green-600">Còn hàng</span>
                            ) : product.stock > 0 ? (
                              <span className="text-yellow-600">Sắp hết</span>
                            ) : (
                              <span className="text-red-600">Hết hàng</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickStockUpdate(product.id, product.stock)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Cập nhật tồn kho"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className="font-medium text-amber-500">{product.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                      </div>
                      <div className="text-xs">
                        {product.isNew && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-1">
                            Mới
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            Bán chạy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(product.id)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Phân trang */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {products.length} / {totalCount} sản phẩm
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="p-1 border border-gray-200 rounded-md disabled:opacity-50"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm">
              Trang {pageNumber} / {totalPages || 1}
            </span>
            <Button
              className="p-1 border border-gray-200 rounded-md disabled:opacity-50"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <select
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(1);
              }}
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}/trang</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modal Thêm/Sửa sản phẩm */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              {modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
            </h2>

            {/* Thông báo */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingProduct?.name || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Thương hiệu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingProduct?.brand || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Giá <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct?.price || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Giá gốc</label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct?.originalPrice || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, originalPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng tồn kho <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct?.stockQuantity || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, stockQuantity: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục <span className="text-red-500">*</span></label>
                <select
                  value={editingProduct?.categoryId || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, categoryId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Ảnh sản phẩm</label>
                <div className="mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Hoặc nhập URL ảnh"
                  value={editingProduct?.imageUrl || ''}
                  onChange={(e) => {
                    setEditingProduct({...editingProduct, imageUrl: e.target.value});
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {(previewUrl || editingProduct?.imageUrl) && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <img
                      src={previewUrl || `http://localhost:9981/${editingProduct?.imageUrl}`}
                      alt="Xem trước"
                      className="h-40 object-contain mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Ảnh+lỗi';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Thông số kỹ thuật</label>
                  <Button
                    className="text-sm px-2 py-1 bg-blue-50 text-blue-700"
                    onClick={addSpecification}
                  >
                    Thêm thông số
                  </Button>
                </div>
                
                {specificationKeys.length === 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    Chưa có thông số nào. Nhấn "Thêm thông số" để bắt đầu.
                  </div>
                )}
                
                {specificationKeys.map((key, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateSpecificationKey(index, e.target.value)}
                      placeholder="Tên thông số (VD: RAM)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={specificationValues[index] || ''}
                      onChange={(e) => updateSpecificationValue(index, e.target.value)}
                      placeholder="Giá trị (VD: 8GB)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      className="text-red-600 p-2"
                      onClick={() => removeSpecification(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct?.isNew || false}
                    onChange={(e) => setEditingProduct({...editingProduct, isNew: e.target.checked})}
                  />
                  <span>Sản phẩm mới</span>
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct?.isBestSeller || false}
                    onChange={(e) => setEditingProduct({...editingProduct, isBestSeller: e.target.checked})}
                  />
                  <span>Sản phẩm bán chạy</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <Button
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </Button>
              <Button
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                onClick={handleSaveProduct}
                disabled={saving}
              >
                {saving && <div className="animate-spin rounded-full border-b-2 border-white w-4 h-4"></div>}
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
