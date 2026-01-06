import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { stockManager } from '../../utils/stockManager';

interface StockUpdate {
  productId: string;
  newStock: number;
  timestamp: number;
}

const StockNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<StockUpdate[]>([]);

  useEffect(() => {
    const unsubscribe = stockManager.subscribe((productId, newStock) => {
      const newNotification: StockUpdate = {
        productId,
        newStock,
        timestamp: Date.now()
      };

      setNotifications(prev => {
        // Remove existing notification for the same product
        const filtered = prev.filter(n => n.productId !== productId);
        return [...filtered, newNotification];
      });

      // Auto remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => 
          prev.filter(n => n.timestamp !== newNotification.timestamp)
        );
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const removeNotification = (timestamp: number) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  };

  // Ẩn hoàn toàn thông báo tồn kho
  return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.timestamp}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg min-w-80 max-w-96"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Cập nhật tồn kho
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Sản phẩm có ID {notification.productId} đã cập nhật số lượng tồn kho: {notification.newStock}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.timestamp)}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockNotification;
