import React from 'react';
import type { Customer } from '../../types';

interface ProfileMetricsProps {
  customer: Pick<Customer, 'orderCount' | 'totalSpent' | 'recentOrders'>;
}

const ProfileMetrics: React.FC<ProfileMetricsProps> = ({ customer }) => {
  if (customer.orderCount === undefined) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium text-gray-800">Thống kê đơn hàng</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500">Tổng đơn hàng</div>
          <div className="text-xl font-bold text-blue-600">{customer.orderCount}</div>
        </div>
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500">Tổng chi tiêu</div>
          <div className="text-xl font-bold text-green-600">
            {customer.totalSpent?.toLocaleString('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }) || '0 ₫'}
          </div>
        </div>
      </div>
      
      {customer.recentOrders && customer.recentOrders.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">Đơn hàng gần đây</h3>
          <div className="overflow-hidden rounded-md border border-gray-200 shadow-sm">
            {customer.recentOrders.map(order => (
              <div key={order.orderId} className="flex justify-between items-center p-3 border-b last:border-b-0 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <div className="font-medium">Đơn hàng #{order.orderId}</div>
                  <div className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {order.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                  {order.paymentStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMetrics;
