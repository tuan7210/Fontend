// DTO cho review trả về từ API product review
export interface ProductReviewItemDto {
  reviewId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductReviewStatisticsDto {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
}

export interface ProductReviewListResponse {
  reviews: ProductReviewItemDto[];
  statistics: ProductReviewStatisticsDto;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
const API_BASE_URL = 'http://localhost:5000/api';

// Interfaces for Review Management
export interface ReviewManagementDto {
  reviewId: number;
  userId: number;
  userName: string;
  userEmail: string;
  productId: number;
  productName: string;
  productBrand: string;
  productImageUrl: string;
  orderItemId: number;
  orderId: number;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  orderStatus: string;
}

export interface ProductReviewSummaryDto {
  productId: number;
  productName: string;
  brand: string;
  imageUrl: string;
  totalReviews: number;
  verifiedReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  recentReviews: ReviewManagementDto[];
}

export interface ReviewFilterDto {
  productId?: number;
  userId?: number;
  rating?: number;
  isVerified?: boolean;
  productName?: string;
  userName?: string;
  brand?: string;
  fromDate?: string;
  toDate?: string;
  searchKeyword?: string;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  pageSize: number;
}

export interface ReviewStatisticsDto {
  totalReviews: number;
  verifiedReviews: number;
  unverifiedReviews: number;
  pendingReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  topReviewedProducts: Array<{
    productId: number;
    productName: string;
    brand: string;
    imageUrl: string;
    reviewCount: number;
    averageRating: number;
  }>;
  mostActiveReviewers: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    reviewCount: number;
    averageRating: number;
    verifiedReviewCount: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

class ReviewService {

  // Lấy danh sách review của sản phẩm (có phân trang, filter, sort)
  async getProductReviews(params: {
    productId: number;
    page?: number;
    pageSize?: number;
    rating?: number;
    sortBy?: 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductReviewListResponse> {
    const { productId, page = 1, pageSize = 10, rating, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const url = new URL(`/api/ProductReview/product/${productId}`, 'http://localhost:5032');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('pageSize', pageSize.toString());
    if (rating) url.searchParams.append('rating', rating.toString());
    if (sortBy) url.searchParams.append('sortBy', sortBy);
    if (sortOrder) url.searchParams.append('sortOrder', sortOrder);
    const token = localStorage.getItem('token');
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Không thể lấy danh sách đánh giá');
    return await res.json();
  }

  // Tạo review mới cho sản phẩm (yêu cầu đăng nhập, chỉ khi đơn hàng đã giao thành công)
  async createProductReview(data: {
    productId: number;
    orderItemId: number;
    rating: number;
    comment: string;
  }): Promise<any> {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5032/api/ProductReview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Không thể tạo đánh giá');
    return result;
  }
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Có lỗi xảy ra');
    }
    
    return data;
  }

  // Lấy thống kê tổng quan
  async getReviewStatistics(): Promise<ApiResponse<ReviewStatisticsDto>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse<ReviewStatisticsDto>(response);
  }

  // Lấy danh sách đánh giá với filter
  async getReviews(filter: ReviewFilterDto): Promise<ApiResponse<ReviewManagementDto[]>> {
    const params = new URLSearchParams();
    
    if (filter.productId) params.append('productId', filter.productId.toString());
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.rating) params.append('rating', filter.rating.toString());
    if (filter.isVerified !== undefined) params.append('isVerified', filter.isVerified.toString());
    if (filter.productName) params.append('productName', filter.productName);
    if (filter.userName) params.append('userName', filter.userName);
    if (filter.brand) params.append('brand', filter.brand);
    if (filter.fromDate) params.append('fromDate', filter.fromDate);
    if (filter.toDate) params.append('toDate', filter.toDate);
    if (filter.searchKeyword) params.append('searchKeyword', filter.searchKeyword);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
    
    params.append('page', filter.page.toString());
    params.append('pageSize', filter.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<ReviewManagementDto[]>(response);
  }

  // Lấy tổng quan đánh giá của một sản phẩm
  async getProductReviewSummary(productId: number): Promise<ApiResponse<ProductReviewSummaryDto>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/product/${productId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<ProductReviewSummaryDto>(response);
  }

  // Duyệt đánh giá
  async verifyReview(reviewId: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/${reviewId}/verify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({})
    });

    return this.handleResponse<any>(response);
  }

  // Hủy duyệt đánh giá
  async unverifyReview(reviewId: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/${reviewId}/unverify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({})
    });

    return this.handleResponse<any>(response);
  }

  // Xóa đánh giá
  async deleteReview(reviewId: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/${reviewId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<any>(response);
  }

  // Duyệt nhiều đánh giá
  async bulkVerifyReviews(reviewIds: number[]): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/bulk-verify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reviewIds })
    });

    return this.handleResponse<any>(response);
  }

  // Xóa nhiều đánh giá
  async bulkDeleteReviews(reviewIds: number[]): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/ReviewManagement/bulk-delete`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reviewIds })
    });

    return this.handleResponse<any>(response);
  }
}

export const reviewService = new ReviewService();
