import { Product } from '../types';

// Base API URL from env
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5032';

// API response shapes
type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type ApiPaged<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

type ApiProduct = {
  productId: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string;
  file?: File;
  brand: string;
  description: string;
  specifications: any; // may be object or JSON string depending on API
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  categoryId: number;
  categoryName: string;
};

// Category mapping: DB -> Frontend category label
const CATEGORY_MAP_DB_TO_FE: Record<string, string> = {
  'Điện thoại': 'Phone',
  'Laptop': 'Laptop',
  'Phụ kiện': 'Accessories',
  'Máy tính bảng': 'Tablet',
};

// Known category slugs to ids (optional fast-path). Adjust if your category ids differ.
const CATEGORY_SLUG_TO_ID: Record<string, number> = {
  phone: 1,
  laptop: 2,
  accessories: 3,
  tablet: 4,
};

function mapApiProduct(p: ApiProduct): Product {
  let specs: Record<string, string> = {};
  if (p.specifications) {
    if (typeof p.specifications === 'string') {
      try { specs = JSON.parse(p.specifications); } catch { specs = {}; }
    } else if (typeof p.specifications === 'object') {
      specs = p.specifications as Record<string, string>;
    }
  }
  return {
    id: String(p.productId),
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.imageUrl,
    category: CATEGORY_MAP_DB_TO_FE[p.categoryName] || p.categoryName,
    brand: p.brand,
    description: p.description,
    specifications: specs,
    stock: p.stockQuantity,
    rating: p.rating || 0,
    reviews: p.reviewCount || 0,
    isNew: !!p.isNew,
    isBestSeller: !!p.isBestSeller,
  };
}

function buildQuery(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    q.append(k, String(v));
  });
  return q.toString();
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) {
    // No Content
    return undefined as unknown as T;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  // Fallback to text for non-JSON responses
  const text = await res.text();
  return text as unknown as T;
}

export const productService = {
  // Get products with optional filters; default to first page with a generous size for current UI needs
  async getProducts(filters?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    minRating?: number;
    isNew?: boolean;
    isBestSeller?: boolean;
    inStock?: boolean;
    categoryId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    pageNumber?: number;
    pageSize?: number;
  }): Promise<{ items: Product[]; totalCount: number; pageNumber: number; pageSize: number }> {
    const query = buildQuery({ pageNumber: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc', ...(filters || {}) });
    const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
    
    return {
      items: (response.data.items || []).map(mapApiProduct),
      totalCount: response.data.totalCount,
      pageNumber: response.data.pageNumber,
      pageSize: response.data.pageSize
    };
  },

  // Get a single product by ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await http<ApiEnvelope<ApiProduct>>(`/api/Product/${id}`);
      return mapApiProduct(response.data);
    } catch (e) {
      return null;
    }
  },

  // Get products by category (name or ID)
  async getProductsByCategory(categoryParam: string | number, limit: number = 20): Promise<Product[]> {
    // Handle numeric IDs
    if (typeof categoryParam === 'number' || !isNaN(Number(categoryParam))) {
      const categoryId = Number(categoryParam);
      const query = buildQuery({ categoryId, pageSize: limit });
      const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
      return (response.data.items || []).map(mapApiProduct);
    }
    
    // Handle string names/slugs
    try {
      const slug = categoryParam.toLowerCase().replace(/\s+/g, '-');
      if (CATEGORY_SLUG_TO_ID[slug]) {
        // Fast path - if we know the ID for this slug
        const categoryId = CATEGORY_SLUG_TO_ID[slug];
        const query = buildQuery({ categoryId, pageSize: limit });
        const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
        return (response.data.items || []).map(mapApiProduct);
      } else {
        // Try API endpoint for category by name if it exists
        try {
          const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product/category/${categoryParam}?pageSize=${limit}`);
          return (response.data.items || []).map(mapApiProduct);
        } catch (e) {
          // Fallback - get all products and filter client-side
          const products = await this.getProducts({ pageSize: 100 });
          
          const dbName = Object.keys(CATEGORY_MAP_DB_TO_FE).find(key => 
            CATEGORY_MAP_DB_TO_FE[key].toLowerCase() === categoryParam.toLowerCase()
          ) || categoryParam;
          
          // Filter from items array
          return products.items.filter(p => (CATEGORY_MAP_DB_TO_FE[dbName] || dbName) === p.category);
        }
      }
    } catch (e) {
      return [];
    }
  },

  // Search products by query text
  async searchProducts(queryText: string): Promise<Product[]> {
    const query = buildQuery({ search: queryText, pageSize: 100 });
    const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
    return (response.data.items || []).map(mapApiProduct);
  },

  // Get popular/featured products
  async getPopularProducts(limit: number = 8): Promise<Product[]> {
    const query = buildQuery({ pageSize: limit, sortBy: 'rating', sortOrder: 'desc' });
    const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
    return (response.data.items || []).map(mapApiProduct);
  },

  // Get newest products
  async getNewProducts(limit: number = 8): Promise<Product[]> {
    const query = buildQuery({ pageSize: limit, isNew: true, sortBy: 'created_at', sortOrder: 'desc' });
    const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
    return (response.data.items || []).map(mapApiProduct);
  },

  // Get best-selling products
  async getBestSellerProducts(limit: number = 8): Promise<Product[]> {
    const query = buildQuery({ pageSize: limit, isBestSeller: true, sortBy: 'name', sortOrder: 'asc' });
    const response = await http<ApiEnvelope<ApiPaged<ApiProduct>>>(`/api/Product?${query}`);
    return (response.data.items || []).map(mapApiProduct);
  },

  // Get all categories
  async getCategories(): Promise<Array<{ categoryId: number; name: string; description: string; }>> {
    try {
      const response = await http<ApiEnvelope<Array<{ categoryId: number; name: string; description: string }>>>('/api/Product/categories');
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  // Get all distinct brands
  async getBrands(): Promise<string[]> {
    try {
      const response = await http<ApiEnvelope<string[]>>('/api/Product/brands');
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  // Create a new product
  async createProduct(productData: {
    name: string;
    price: number;
    originalPrice?: number;
    image?: string; 
    file?: File;
    brand: string;
    description: string;
    specifications: Record<string, string> | string;
    stock: number; 
    rating?: number;
    reviews?: number;
    isNew?: boolean;
    isBestSeller?: boolean;
    categoryId: number;
  }, id?: number): Promise<boolean> {
    // Create FormData for file upload support
    const formData = new FormData();
    
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    if (productData.originalPrice !== undefined) {
      formData.append('originalPrice', productData.originalPrice.toString());
    }
    if (productData.image) {
      formData.append('imageUrl', productData.image);
    }
    if (productData.file) {
      formData.append('file', productData.file);
    }
    formData.append('brand', productData.brand);
    formData.append('description', productData.description);
    formData.append('specifications', typeof productData.specifications === 'string' 
      ? productData.specifications 
      : JSON.stringify(productData.specifications || {}));
    formData.append('stockQuantity', productData.stock.toString());
    formData.append('rating', (productData.rating || 0).toString());
    formData.append('reviewCount', (productData.reviews || 0).toString());
    formData.append('isNew', (!!productData.isNew).toString());
    formData.append('isBestSeller', (!!productData.isBestSeller).toString());
    formData.append('categoryId', productData.categoryId.toString());
    
    const res = await fetch(`${API_URL}/api/Product`, {
      method: 'POST',
      body: formData,
    });
    console.log(res);
    return true;
  },

  // Update an existing product
  async updateProduct(id: string, productData: {
    name: string;
    price: number;
    originalPrice?: number;
    image?: string; 
    file?: File;
    brand: string;
    description: string;
    specifications: Record<string, string> | string;
    stock: number; 
    rating?: number;
    reviews?: number;
    isNew?: boolean;
    isBestSeller?: boolean;
    categoryId: number;
  }): Promise<boolean> {
    const formData = new FormData();
    
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    if (productData.originalPrice !== undefined) {
      formData.append('originalPrice', productData.originalPrice.toString());
    }
    if (productData.image) {
      formData.append('imageUrl', productData.image);
    }
    if (productData.file) {
      formData.append('file', productData.file);
    }
    formData.append('brand', productData.brand);
    formData.append('description', productData.description);
    formData.append('specifications', typeof productData.specifications === 'string' 
      ? productData.specifications 
      : JSON.stringify(productData.specifications || {}));
    formData.append('stockQuantity', productData.stock.toString());
    formData.append('rating', (productData.rating || 0).toString());
    formData.append('reviewCount', (productData.reviews || 0).toString());
    formData.append('isNew', (!!productData.isNew).toString());
    formData.append('isBestSeller', (!!productData.isBestSeller).toString());
    formData.append('categoryId', productData.categoryId.toString());

    console.log(formData);
    // const response = await http<ApiEnvelope<ApiProduct>>(`/api/Product/${id}`, {
    //   method: 'PUT',
    //   body: formData,
    // });
    
    // console.log(response);
    return true;
  },

  // Delete a product by ID
  async deleteProduct(id: string): Promise<boolean> {
    const response = await http<ApiEnvelope<boolean>>(`/api/Product/${id}`, {
      method: 'DELETE'
    });
    
    return response.success;
  },
};