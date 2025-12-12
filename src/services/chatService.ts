// Chat AI Service for product consultation - Updated for new backend API

// 1. Request Interface (Gửi lên server)
export interface NewChatRequest {
  query: string;
  top_k?: number;
}

// 2. Product Interface (Trong 'context' của response)
export interface NewChatProduct {
  id: string;
  product_id: number;
  name: string;
  brand: string;
  category_name: string;
  price: number;
  image_url: string;
  usp: string;
  spec_text: string;
}

// 3. Response Interface (Server trả về)
export interface NewChatResponse {
  answer: string;
  context: NewChatProduct[];
}

// --- Interfaces cũ để tương thích với component ---
// Component đang dùng các tên field này, nên ta sẽ map dữ liệu mới về cấu trúc này
export interface ChatProduct {
  productId: number;
  name: string;
  brand: string;
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
  mode: ChatMode; // Sẽ được gán mặc định vì API mới không có
  products: ChatProduct[];
}
// --- Hết phần interfaces cũ ---


const BASE_URL = 'http://localhost:8000'; // URL backend mới

/**
 * Gửi câu hỏi đến API chat mới và chuyển đổi response về định dạng cũ
 * để component ChatBox.tsx có thể sử dụng mà không cần sửa nhiều.
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
  
  // Chuyển đổi (map) dữ liệu từ API mới sang cấu trúc dữ liệu cũ mà component đang dùng
  const mappedProducts: ChatProduct[] = newData.context.map(p => ({
    productId: p.product_id,
    name: p.name,
    brand: p.brand,
    category: p.category_name,
    price: p.price,
    imageUrl: p.image_url,
    usp: p.usp,
    specificationsText: p.spec_text,
    // Các trường cũ không có trong API mới sẽ để là null/undefined
    description: null, 
    useCase: null,
  }));

  // Trả về dữ liệu theo cấu trúc cũ
  return {
    answer: newData.answer,
    products: mappedProducts,
    mode: 'openai', // Gán giá trị mặc định vì API mới không có 'mode'
  };
}

export const chatService = {
  askChat
};
