// Chat AI Service for product consultation - FIXED with session_id

// 1. Request Interface (Gửi lên server)
export interface NewChatRequest {
  query: string;
  session_id: string;   // ✅ THÊM
  top_k?: number;
}

// 2. Product Interface (Backend trả về)
export interface NewChatProduct {
  id?: string;
  product_id?: number;
  name?: string;
  brand?: string;
  category_name?: string;
  price?: number;
  image?: string;
  image_url?: string;
  usp?: string;
  spec_text?: string;
}

// 3. Response Interface
export interface NewChatResponse {
  answer: string;
  products: NewChatProduct[];
  state?: any;
}

// --- Interfaces cũ ---
export interface ChatProduct {
  productId: number;
  name: string;
  brand?: string;
  category?: string | null;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  useCase?: string | null;
  usp?: string | null;
  specificationsText?: string | null;
}

export type ChatMode = 'openai' | 'fallback';

export interface ChatResponseData {
  answer: string;
  mode: ChatMode;
  products: ChatProduct[];
}
// --- END interfaces ---

const BASE_URL = 'http://localhost:8000'; // Python search/chat service
const IMAGE_BASE = (import.meta as any).env?.VITE_IMAGE_BASE || 'http://localhost:5032'; // ASP.NET API for static images

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  // Nếu là URL tuyệt đối thì giữ nguyên
  if (/^https?:\/\//i.test(url)) return url;
  // Nếu bắt đầu bằng '/' (ví dụ '/images/...') thì nối với IMAGE_BASE
  if (url.startsWith('/')) return `${IMAGE_BASE}${url}`;
  // Nếu chỉ là tên file (ví dụ 'abc.jpg') thì mặc định nằm trong '/images'
  return `${IMAGE_BASE}/images/${url}`;
}

/**
 * Gửi câu hỏi đến API chat và map về format cũ
 */
export async function askChat(req: NewChatRequest): Promise<ChatResponseData> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorBody || 'Không thể kết nối đến server'}`);
  }

  const newData = (await res.json()) as NewChatResponse;

  const rawProducts = Array.isArray(newData.products) ? newData.products : [];

  const mappedProducts: ChatProduct[] = rawProducts.map(p => ({
    productId: Number(p.product_id || p.id || 0),
    name: p.name || '',
    brand: p.brand,
    category: p.category_name || null,
    price: Number(p.price || 0),
    imageUrl: resolveImageUrl(p.image_url || p.image || null),
    usp: p.usp || null,
    specificationsText: p.spec_text || null,
    // Các trường cũ không có trong API mới sẽ để là null/undefined
    description: null,
    useCase: null,
  }));

  return {
    answer: newData.answer || '',
    products: mappedProducts,
    mode: 'openai',
  };
}

export const chatService = {
  askChat,
};
