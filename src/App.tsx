// Scroll to top on route change
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import UserProfile from './pages/UserProfile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReviews from './pages/admin/AdminReviews';
import CashOnDeliveryInfo from './pages/CashOnDeliveryInfo';
import CashOnDeliveryConfirm from './pages/CashOnDeliveryConfirm';
import CheckoutOnline from './pages/CheckoutOnline';
import LoadingSpinner from './components/UI/LoadingSpinner';
import StockNotification from './components/UI/StockNotification';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main layout component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <StockNotification />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          {/* Public routes with main layout */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
          <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<MainLayout><OrderHistory /></MainLayout>} />
          <Route path="/order-history" element={<MainLayout><OrderHistory /></MainLayout>} />
          <Route path="/order-detail/:id" element={
            <ProtectedRoute>
              <MainLayout><OrderDetail /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/account" element={<MainLayout><UserProfile /></MainLayout>} />
          <Route path="/cash-on-delivery-confirm" element={<MainLayout><CashOnDeliveryConfirm /></MainLayout>} />
          <Route path="/cash-on-delivery-info" element={<MainLayout><CashOnDeliveryInfo /></MainLayout>} />
          <Route path="/checkout-online" element={<MainLayout><CheckoutOnline /></MainLayout>} />
          {/* Đã loại bỏ route Search vì chức năng tìm kiếm đã được tích hợp vào trang Home */}
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;