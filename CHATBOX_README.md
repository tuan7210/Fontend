# ChatBox AI - Hướng Dẫn Sử Dụng

## Tổng Quan

ChatBox AI là tính năng tư vấn sản phẩm thông minh sử dụng AI để giúp khách hàng tìm kiếm sản phẩm phù hợp với nhu cầu của họ.

## Tính Năng Chính

### 1. **Giao Diện Hiện Đại**
- Icon chat nổi ở góc phải dưới màn hình
- Thiết kế gradient đẹp mắt với hiệu ứng hover
- Badge "AI" để thu hút sự chú ý
- Responsive, hoạt động tốt trên mọi thiết bị

### 2. **Tương Tác Thông Minh**
- Trả lời câu hỏi bằng AI (mode: openai) hoặc gợi ý có cấu trúc (mode: fallback)
- Hiển thị danh sách sản phẩm gợi ý kèm theo câu trả lời
- Lịch sử chat được lưu trong phiên làm việc
- Hỗ trợ nhấn Enter để gửi tin nhắn nhanh

### 3. **Tùy Chỉnh**
- Slider TopK (3, 5, 7, 10) để điều chỉnh số lượng sản phẩm gợi ý
- Hiển thị badge phân biệt giữa câu trả lời AI và gợi ý thông thường

### 4. **Hiển Thị Sản Phẩm**
- Card sản phẩm đẹp mắt với hình ảnh, tên, giá
- Thông tin chi tiết: brand, category, useCase, usp
- Link trực tiếp đến trang chi tiết sản phẩm
- Hover effect để tăng trải nghiệm người dùng

## Cấu Trúc File

```
src/
├── services/
│   └── chatService.ts          # Service API cho ChatBox
├── components/
│   └── UI/
│       └── ChatBox.tsx          # Component ChatBox chính
└── pages/
    └── Home.tsx                 # Trang Home tích hợp ChatBox
```

## Cấu Hình Backend

### API Endpoint
- **URL**: `POST /api/Chat/ask`
- **Base URL**: `http://localhost:5032` (hoặc theo biến môi trường `VITE_API_BASE`)

### Request Body
```json
{
  "question": "Tôi cần laptop lập trình, pin trâu",
  "topK": 5
}
```

### Response
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "answer": "Câu trả lời từ AI...",
    "mode": "openai",
    "products": [
      {
        "productId": 123,
        "name": "Laptop Dell XPS 15",
        "brand": "Dell",
        "category": "Laptop",
        "price": 25000000,
        "imageUrl": "dell-xps-15.jpg",
        "useCase": "Phù hợp cho lập trình viên",
        "usp": "Pin 12 giờ, hiệu năng cao",
        "specificationsText": "i7-12700H, 16GB RAM, 512GB SSD"
      }
    ]
  }
}
```

## Biến Môi Trường

Tạo file `.env` trong thư mục root:

```env
VITE_API_BASE=http://localhost:5032
```

## Cách Sử Dụng

### 1. Khởi Động Backend
Đảm bảo backend đang chạy và endpoint `/api/Chat/ask` hoạt động bình thường.

### 2. Kiểm Tra API
```bash
curl -X POST http://localhost:5032/api/Chat/ask \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"Tư vấn laptop lập trình\",\"topK\":5}"
```

### 3. Chạy Frontend
```bash
npm run dev
```

### 4. Sử Dụng ChatBox
1. Truy cập trang Home
2. Click vào icon chat ở góc phải dưới
3. Nhập câu hỏi hoặc mô tả nhu cầu
4. Xem kết quả và danh sách sản phẩm gợi ý
5. Click vào sản phẩm để xem chi tiết

## Ví Dụ Câu Hỏi

- "Tôi cần laptop cho lập trình, pin trâu, giá dưới 20 triệu"
- "Điện thoại chụp ảnh đẹp, giá tầm trung"
- "Tai nghe gaming có micro tốt"
- "Tablet cho học sinh, vẽ được"
- "Laptop gaming RTX 4060, 16GB RAM"

## Tùy Chỉnh Giao Diện

### Thay Đổi Màu Sắc
Trong file `ChatBox.tsx`, tìm các class gradient:
```tsx
// Nút chat
className="bg-gradient-to-br from-blue-600 to-purple-600"

// Header
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Tin nhắn user
className="bg-gradient-to-br from-blue-600 to-blue-700"
```

### Thay Đổi Vị Trí
```tsx
// Góc phải dưới (mặc định)
className="fixed bottom-6 right-6"

// Góc trái dưới
className="fixed bottom-6 left-6"

// Góc phải trên
className="fixed top-6 right-6"
```

### Thay Đổi Kích Thước
```tsx
// ChatBox window
className="w-[420px] h-[600px]"

// Icon button
className="w-16 h-16"
```

## Xử Lý Lỗi

### 1. Không Kết Nối Được Backend
- Kiểm tra backend đang chạy
- Kiểm tra CORS được bật
- Kiểm tra URL trong `.env`

### 2. Không HiểnỊ Hình Ảnh
- Kiểm tra đường dẫn ảnh từ backend
- Đảm bảo endpoint `/api/Product/image/{filename}` hoạt động

### 3. Lỗi TypeScript
```bash
# Cài đặt types
npm install --save-dev @types/node
```

## Performance Tips

1. **Lazy Loading**: ChatBox chỉ render khi được mở
2. **Debounce Input**: Tránh gửi request liên tục
3. **Cache Response**: Lưu lại kết quả đã search
4. **Optimize Images**: Sử dụng WebP, lazy load ảnh sản phẩm

## Tích Hợp Vào Các Trang Khác

Để thêm ChatBox vào trang khác:

```tsx
import ChatBox from '../components/UI/ChatBox';

function MyPage() {
  return (
    <div>
      <ChatBox />
      {/* Nội dung trang */}
    </div>
  );
}
```

## Future Enhancements

- [ ] Lưu lịch sử chat vào localStorage
- [ ] Hỗ trợ đa ngôn ngữ
- [ ] Voice input
- [ ] Chia sẻ kết quả tư vấn
- [ ] Rating câu trả lời AI
- [ ] Export conversation
- [ ] Push notification cho câu trả lời
- [ ] Typing indicator animation
- [ ] Read receipts
- [ ] Multi-turn conversation context

## Troubleshooting

### ChatBox không hiển thị
1. Check console for errors
2. Verify import paths
3. Check CSS conflicts

### API trả về lỗi 404
1. Verify backend endpoint exists
2. Check CORS settings
3. Verify API base URL

### Sản phẩm không load ảnh
1. Check image path format
2. Verify backend serves images correctly
3. Check network tab for image requests

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Verify backend API với curl/Postman
3. Check network tab trong DevTools
4. Review backend logs

## Credits

- UI Design: Inspired by modern chat interfaces
- Icons: Lucide React
- Styling: Tailwind CSS
- AI Integration: Backend OpenAI service
