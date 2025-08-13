export const authService = {
  async login(email: string, password: string) {
    try {
      // Trước tiên, gọi API đăng nhập để lấy token
      const response = await fetch('http://localhost:5032/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      // Kiểm tra nếu tài khoản bị khóa
      if (response.ok && data.status === 'locked') {
        return { 
          success: false, 
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên.'
        };
      }
      
      if (response.ok && data.token) {
        // Lưu token
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userInfo', JSON.stringify(data));
        
        // Đảm bảo có đủ thông tin người dùng
        if (!data.userId) {
          
          try {
            // Gọi API để lấy thông tin chi tiết người dùng
            const userResponse = await fetch(`http://localhost:5032/api/Customer/${data.id}`, {
              headers: {
                'Authorization': `Bearer ${data.token}`,
                'Accept': 'application/json'
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              
              // Cập nhật thông tin user nếu API trả về thành công
              if (userData.success && userData.data) {
                return { 
                  success: true, 
                  token: data.token, 
                  role: data.role || userData.data.role, 
                  name: userData.data.name || data.name || '',
                  userId: userData.data.userId || data.userId || 0,
                  status: userData.data.status || data.status || 'active',
                  message: data.message || 'Đăng nhập thành công'
                };
              }
            }
          } catch (userApiError) {
          }
        }
        
        // Trả về dữ liệu ban đầu nếu không lấy được thêm thông tin
        return { 
          success: true, 
          token: data.token, 
          role: data.role, 
          name: data.name || '', 
          userId: data.userId || 0,
          status: data.status || 'active',
          message: data.message || 'Đăng nhập thành công'
        };
      }
      return { success: false, message: data.message || 'Đăng nhập thất bại.' };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối server.' };
    }
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) {
    try {
      const response = await fetch('http://localhost:5032/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Đăng ký thất bại.' };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối server.' };
    }
  },
};