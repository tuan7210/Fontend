import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; role?: string }> => {
    try {
      const result = await authService.login(email, password);
      console.log('authService login result:', result); // Debug
      if (result.success) {
        // Tài khoản admin mẫu
        const isAdminAccount = email.toLowerCase() === 'admin@techstore.com';
        
        // Đảm bảo role được gán đúng, nếu API không trả về role
        const userRole = result.role || (isAdminAccount ? 'admin' : 'customer');
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', userRole);
        
        const nextUser: User = {
          email,
          role: userRole,
          name: result.name || '',
          userId: result.userId || 0,
        };
        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
        return { success: true, message: result.message, role: userRole };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Lỗi đăng nhập.' };
    }
  };

  const register = async (userData: any): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await authService.register(userData);
      if (result.success) {
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Lỗi đăng ký.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};