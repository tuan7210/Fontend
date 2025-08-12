// Script để khởi động backend API
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Đang khởi động backend API...');

// Đường dẫn đến file .env
const envPath = path.resolve(__dirname, '..', '.env');
let port = 5032; // Mặc định là port 5032

// Đọc port từ file .env nếu có
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_API_URL=http:\/\/localhost:(\d+)/);
  if (match && match[1]) {
    port = parseInt(match[1], 10);
    console.log(`📌 Tìm thấy cấu hình port trong .env: ${port}`);
  }
}

// Cố gắng khởi động backend trên port đã cấu hình
try {
  // Thay 'dotnet run' bằng lệnh thích hợp để khởi động backend của bạn
  // Ví dụ: 'node server.js', 'npm run start:api', v.v.
  const backend = spawn('dotnet', ['run', '--project', '../backend/TechStoreAPI', '--urls', `http://localhost:${port}`], {
    stdio: 'inherit',
    shell: true
  });

  backend.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend đã dừng với mã thoát ${code}`);
    } else {
      console.log('👋 Backend đã dừng');
    }
  });

  console.log(`✅ Backend đang chạy tại http://localhost:${port}`);
  console.log('🔍 Nhấn Ctrl+C để dừng');
} catch (error) {
  console.error('❌ Không thể khởi động backend:', error);
}
