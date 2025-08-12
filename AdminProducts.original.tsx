import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import Button from '../../components/UI/Button';
import { stockManager } from '../../utils/stockManager';

import { Product } from '../../types';
const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Array<{ categoryId: number; categoryName: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [inStock, setInStock] = useState<string>('');
  const [editing, setEditing] = useState<null | (Partial<Product> & { id?: string; categoryId?: number })>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  // Extra fields for create-only
  const [isNewCreate, setIsNewCreate] = useState<boolean>(false);
  const [isBestSellerCreate, setIsBestSellerCreate] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // Load categories and brands once
    const loadMeta = async () => {
      try {
        const [cats, brs] = await Promise.all([
          productService.getCategories(),
          productService.getBrands(),
        ]);
        setCategories(cats || []);
        setBrands(brs || []);
      } catch (e) {
        // ignore
      }
    };
    loadMeta();
  }, []);

  const fetchProducts = async () => {
      setLoading(true);
      try {
        // Xóa cache của stockManager để đảm bảo lấy dữ liệu mới nhất từ server
        stockManager.clearCache();
        
        const res = await productService.getProductsPaged({
          search: search || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          brand: brandFilter || undefined,
          inStock: inStock ? inStock === 'true' : undefined,
          pageNumber,
          pageSize,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        setProducts(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
        setErrorMsg('');
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    
  // Hàm refresh dữ liệu stock từ server
  const refreshStock = async () => {
    setLoading(true);
    try {
      // Xóa cache hiện tại
      stockManager.clearCache();
      
      // Đồng bộ lại dữ liệu từ server
      await stockManager.refreshAllProducts();
      
      // Fetch lại danh sách sản phẩm
      await fetchProducts();
      
      setSuccessMsg('Đã cập nhật số lượng tồn kho từ server');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể cập nhật số lượng tồn kho');
    } finally {
      setLoading(false);
    }
  };

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
    
    // Tạo URL xem trước ảnh
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Hàm chuyển đổi File thành base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, brandFilter, inStock, pageNumber, pageSize]);

  const filteredProducts = products; // Đã lọc ở server

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
  <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Quản lý kho hàng
        </h1>
        <div className="flex items-center gap-3">
          <Button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={refreshStock}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang cập nhật...' : 'Cập nhật tồn kho'}
          </Button>
          <Button
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => {
              // Chọn danh mục đầu tiên nếu có danh sách danh mục
              const firstCategoryId = categories.length > 0 ? categories[0].categoryId : undefined;
              setEditing({ 
                name: '', 
                description: '', 
                brand: '', 
                price: 0, 
                image: '', 
                specifications: {}, 
                stock: 0,
                categoryId: firstCategoryId // Tự động chọn danh mục đầu tiên
              });
              setIsNewCreate(false);
              setIsBestSellerCreate(false);
              setSelectedFile(null);
              setPreviewUrl('');
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>
      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2">
          {successMsg}
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm, danh mục..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={categoryId}
          onChange={e => { setCategoryId(e.target.value); setPageNumber(1); }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
          ))}
        </select>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={brandFilter}
          onChange={e => { setBrandFilter(e.target.value); setPageNumber(1); }}
        >
          <option value="">Tất cả thương hiệu</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inStock}
          onChange={e => { setInStock(e.target.value); setPageNumber(1); }}
        >
          <option value="">Tất cả kho</option>
          <option value="true">Còn hàng</option>
          <option value="false">Hết hàng</option>
        </select>
      </div>
  <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="py-3 px-4 text-left">Tên sản phẩm</th>
              <th className="py-3 px-4 text-left">Danh mục</th>
              <th className="py-3 px-4 text-left">Giá</th>
              <th className="py-3 px-4 text-left">Kho</th>
              <th className="py-3 px-4 text-left">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Không có sản phẩm nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product: any) => (
                <tr key={product.id} className="border-b last:border-b-0">
                  <td className="py-3 px-4 font-semibold text-gray-800">{product.name}</td>
                  <td className="py-3 px-4 text-gray-600">{product.category}</td>
                  <td className="py-3 px-4 text-blue-700 font-bold">{product.price.toLocaleString()} đ</td>
                  <td className="py-3 px-4 text-green-700 font-semibold">{product.stock}</td>
                  <td className="py-3 px-4">
                    {product.stock > 0 ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">Còn hàng</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium">Hết hàng</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      className="p-2 rounded hover:bg-blue-50 text-blue-600"
                      onClick={() => {
                        setEditing({ ...product, categoryId: categories.find(c => c.categoryName === product.category)?.categoryId });
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-red-50 text-red-600"
                      onClick={async () => {
                        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
                        try {
                          await productService.deleteProduct(product.id);
                          setSuccessMsg('Đã xóa sản phẩm.');
                          setErrorMsg('');
                          await fetchProducts();
                        } catch (e) {
                          setSuccessMsg('');
                          setErrorMsg(e instanceof Error ? e.message : 'Xóa sản phẩm thất bại');
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Tổng: {totalCount.toLocaleString()} sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="px-3 py-1"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Trang {pageNumber} / {totalPages}
            </span>
            <Button
              className="px-3 py-1"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <select
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={e => { setPageNumber(1); setPageSize(Number(e.target.value)); }}
            >
              {[10, 12, 20, 50].map(size => (
                <option key={size} value={size}>{size}/trang</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{editing?.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên</label>
                <input className="w-full border rounded px-3 py-2" value={editing?.name || ''} onChange={e => setEditing(prev => ({ ...(prev as any), name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                <input className="w-full border rounded px-3 py-2" value={editing?.brand || ''} onChange={e => setEditing(prev => ({ ...(prev as any), brand: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={editing?.description || ''} onChange={e => setEditing(prev => ({ ...(prev as any), description: e.target.value }))} />
              </div>
              {/* Create-only fields to satisfy backend payload */}
              {!editing?.id && (
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={isNewCreate} onChange={e => setIsNewCreate(e.target.checked)} />
                    <span>Mới (isNew)</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={isBestSellerCreate} onChange={e => setIsBestSellerCreate(e.target.checked)} />
                    <span>Bán chạy (isBestSeller)</span>
                  </label>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Giá</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={editing?.price ?? 0} onChange={e => setEditing(prev => ({ ...(prev as any), price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá gốc</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={editing?.originalPrice ?? 0} onChange={e => setEditing(prev => ({ ...(prev as any), originalPrice: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng trong kho</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={editing?.stock ?? 0} onChange={e => setEditing(prev => ({ ...(prev as any), stock: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục <span className="text-red-500">*</span></label>
                <select 
                  className="w-full border rounded px-3 py-2 bg-white" 
                  value={String(editing?.categoryId || '')} 
                  onChange={e => setEditing(prev => ({ ...(prev as any), categoryId: Number(e.target.value) }))}
                  required
                  style={{ color: "#000000", fontWeight: "bold", fontSize: "16px" }}
                >
                  <option value="" disabled style={{ color: "#000000", fontWeight: "bold", fontSize: "16px" }}>Chọn danh mục</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId} style={{ color: "#000000", fontWeight: "bold", fontSize: "16px" }}>{c.categoryName}</option>
                  ))}
                </select>
                {!editing?.categoryId && (
                  <p className="text-sm text-red-500 mt-1">Vui lòng chọn danh mục</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Ảnh sản phẩm</label>
                {editing?.id ? (
                  // Trường hợp chỉnh sửa: cho phép nhập URL
                  <div>
                    <input 
                      className="w-full border rounded px-3 py-2" 
                      value={editing?.image || ''} 
                      onChange={e => setEditing(prev => ({ ...(prev as any), image: e.target.value }))} 
                      placeholder="Nhập URL ảnh"
                    />
                    {editing?.image && (
                      <div className="mt-2 border p-2 rounded">
                        <img 
                          src={editing.image} 
                          alt="Xem trước" 
                          className="h-40 object-contain mx-auto"
                          onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Ảnh+lỗi'}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Trường hợp thêm mới: cho phép upload từ máy
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {editing?.image && !previewUrl && (
                        <Button 
                          className="text-red-600 bg-red-50 hover:bg-red-100 text-sm py-1" 
                          onClick={() => setEditing(prev => ({ ...(prev as any), image: '' }))}
                        >
                          Xóa URL
                        </Button>
                      )}
                    </div>
                    
                    {/* Hiển thị ảnh xem trước */}
                    {(previewUrl || editing?.image) && (
                      <div className="mt-2 border p-2 rounded">
                        <img 
                          src={previewUrl || editing?.image} 
                          alt="Xem trước" 
                          className="h-40 object-contain mx-auto"
                          onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Ảnh+lỗi'} 
                        />
                      </div>
                    )}
                    
                    {/* Cho phép nhập URL thay thế */}
                    <div className="mt-2">
                      <label className="text-xs text-gray-500 block mb-1">Hoặc nhập URL ảnh:</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editing?.image || ''} 
                        onChange={e => {
                          setEditing(prev => ({ ...(prev as any), image: e.target.value }));
                          if (e.target.value) {
                            setSelectedFile(null);
                            setPreviewUrl('');
                          }
                        }} 
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                )}
              </div>
              
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button className="bg-gray-200 text-gray-800" onClick={() => { setShowModal(false); setEditing(null); }}>Hủy</Button>
              <Button
                className="bg-blue-600 text-white"
                disabled={saving}
                onClick={async () => {
                  if (!editing) return;
                  const isCreate = !editing.id;
                  const priceNum = Number(editing.price);
                  if (!editing.name || isNaN(priceNum) || priceNum < 0 || (isCreate && !editing.categoryId)) {
                    setErrorMsg(isCreate ? 'Vui lòng nhập tên, giá hợp lệ và chọn danh mục.' : 'Vui lòng nhập tên và giá hợp lệ.');
                    return;
                  }
                  setSaving(true);
                  try {
                    let payload: any;
                    
                    // Xử lý tải ảnh lên nếu có file được chọn
                    if (selectedFile && !editing.id) {
                      try {
                        const base64Image = await fileToBase64(selectedFile);
                        // Lưu base64 string vào trường imageUrl để phù hợp với API
                        payload = { 
                          name: editing.name,
                          description: editing.description,
                          price: editing.price,
                          originalPrice: editing.originalPrice || editing.price,
                          brand: editing.brand,
                          stockQuantity: editing.stock, // Đổi stock thành stockQuantity
                          categoryId: editing.categoryId,
                          imageUrl: base64Image, // Đổi image thành imageUrl
                          specifications: JSON.stringify({}), // Chuyển đổi thành chuỗi JSON
                          isNew: isNewCreate, 
                          isBestSeller: isBestSellerCreate 
                        };
                      } catch (error) {
                        setErrorMsg('Không thể xử lý ảnh. Vui lòng thử lại.');
                        setSaving(false);
                        return;
                      }
                    } else {
                      // Nếu không có file được chọn, sử dụng URL ảnh từ input
                      if (isCreate) {
                        payload = { 
                          name: editing.name,
                          description: editing.description,
                          price: editing.price,
                          originalPrice: editing.originalPrice || editing.price,
                          brand: editing.brand,
                          stockQuantity: editing.stock, // Đổi stock thành stockQuantity
                          categoryId: editing.categoryId,
                          imageUrl: editing.image, // Đổi image thành imageUrl
                          specifications: JSON.stringify({}), // Chuyển đổi thành chuỗi JSON
                          isNew: isNewCreate, 
                          isBestSeller: isBestSellerCreate 
                        };
                      } else {
                        payload = { ...editing } as any;
                      }
                    }
                    
                    // Kiểm tra xem có ảnh không
                    if (isCreate && !payload.imageUrl) {
                      setErrorMsg('Vui lòng chọn ảnh sản phẩm');
                      setSaving(false);
                      return;
                    }
                    
                    if (editing.id) {
                      await productService.updateProduct(editing.id, payload);
                      setSuccessMsg('Đã cập nhật sản phẩm thành công.');
                      await fetchProducts();
                      setShowModal(false);
                      setEditing(null);
                    } else {
                      await productService.createProduct(payload);
                      setSuccessMsg('Đã tạo sản phẩm thành công.');
                      setPageNumber(1); // quay về trang đầu
                      await fetchProducts();
                      // Hiển thị thông báo thành công một lúc trước khi đóng modal
                      setTimeout(() => {
                        setShowModal(false);
                        setEditing(null);
                      }, 1500);
                    }
                    setErrorMsg('');
                  } catch (error) {
                    setSuccessMsg('');
                    setErrorMsg(error instanceof Error ? `Lưu sản phẩm thất bại: ${error.message}` : 'Lưu sản phẩm thất bại. Vui lòng kiểm tra kết nối API hoặc quyền truy cập.');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
