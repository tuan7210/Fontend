import React from 'react';
import { Settings } from 'lucide-react';
import Button from '../../components/UI/Button';

const AdminSettings: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Cài đặt hệ thống
        </h1>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin hệ thống</h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Tên cửa hàng</label>
          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="TechStore" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email liên hệ</label>
          <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="admin@example.com" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Địa chỉ</label>
          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="123 Đường ABC, Quận 1, TP.HCM" />
        </div>
        <Button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">Lưu thay đổi</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
