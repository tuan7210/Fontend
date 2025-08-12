import React, { useEffect, useState } from 'react';
import { Users, Search, Pencil, Trash2, Lock, Unlock, AlertCircle } from 'lucide-react';
import Button from '../../components/UI/Button';
import type { Customer } from '../../types';
import { getCustomers, updateCustomer, deleteCustomer, lockCustomerAccount, unlockCustomerAccount } from '../../services/userService';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const AdminUsers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit modal state
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getCustomers({ page, pageSize, search: search || undefined });
      setCustomers(resp.items);
      setTotalPages(resp.totalPages);
      setTotalCount(resp.totalCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Không tải được danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', address: c.address || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError(null);
    try {
      const updated = await updateCustomer(editing.userId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || '',
        address: form.address?.trim() || '',
      });
      setSuccess('Cập nhật khách hàng thành công');
      setEditing(null);
      setCustomers(prev => prev.map(x => (x.userId === updated.userId ? updated : x)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Cập nhật thất bại');
    }
  };

  const confirmDelete = async (c: Customer) => {
    if (!window.confirm(`Xoá khách hàng ${c.name} (${c.email})?`)) return;
    setError(null);
    try {
      await deleteCustomer(c.userId);
      setSuccess('Xoá khách hàng thành công');
      // refetch to get accurate pagination counts
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Xoá khách hàng thất bại');
    }
  };
  
  // Hàm khóa tài khoản
  const handleLockAccount = async (c: Customer) => {
    if (c.role === 'admin') {
      setError('Không thể khóa tài khoản admin');
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn khóa tài khoản của ${c.name}?`)) return;
    setError(null);
    
    try {
      await lockCustomerAccount(c.userId);
      setSuccess(`Đã khóa tài khoản của ${c.name} thành công`);
      // Cập nhật lại danh sách khách hàng
      setCustomers(prev => prev.map(customer => 
        customer.userId === c.userId 
          ? { ...customer, status: 'locked' } 
          : customer
      ));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Khóa tài khoản thất bại');
    }
  };
  
  // Hàm mở khóa tài khoản
  const handleUnlockAccount = async (c: Customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản của ${c.name}?`)) return;
    setError(null);
    
    try {
      await unlockCustomerAccount(c.userId);
      setSuccess(`Đã mở khóa tài khoản của ${c.name} thành công`);
      // Cập nhật lại danh sách khách hàng
      setCustomers(prev => prev.map(customer => 
        customer.userId === c.userId 
          ? { ...customer, status: 'active' } 
          : customer
      ));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Mở khóa tài khoản thất bại');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Quản lý khách hàng
        </h1>
      </div>

      {/* banners */}
      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 rounded-md bg-green-50 border border-green-200 text-green-700 px-4 py-2">
          {success}
        </div>
      )}

      {/* search and page size */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="Tìm kiếm tên, email, SĐT..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <Button onClick={onSearch}>Tìm kiếm</Button>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s}/trang</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="py-3 px-4 text-left">Tên</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">SĐT</th>
              <th className="py-3 px-4 text-left">Vai trò</th>
              <th className="py-3 px-4 text-left">Trạng thái</th>
              <th className="py-3 px-4 text-left">Địa chỉ</th>
              <th className="py-3 px-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">Đang tải dữ liệu...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Không có khách hàng nào.</td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.userId} className="border-b last:border-b-0">
                  <td className="py-3 px-4 font-semibold text-gray-800">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.email}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone || '-'}</td>
                  <td className="py-3 px-4 text-blue-700 font-bold">{c.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</td>
                  <td className="py-3 px-4">
                    {c.status === 'locked' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center w-fit gap-1">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center w-fit gap-1">
                        <Unlock className="w-3 h-3" /> Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.address || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" /> Sửa
                      </button>
                      {c.role !== 'admin' && (
                        c.status !== 'locked' ? (
                          <button
                            onClick={() => handleLockAccount(c)}
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 px-2 py-1"
                            title="Khóa tài khoản"
                          >
                            <Lock className="w-4 h-4" /> Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlockAccount(c)}
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1"
                            title="Mở khóa tài khoản"
                          >
                            <Unlock className="w-4 h-4" /> Mở khóa
                          </button>
                        )
                      )}
                      <button
                        onClick={() => confirmDelete(c)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 px-2 py-1"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" /> Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">Tổng: {totalCount}</div>
        <div className="flex items-center gap-2">
          <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
          <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      </div>

      {/* edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa khách hàng</h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Tên</span>
                <input className="border rounded px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Email</span>
                <input className="border rounded px-3 py-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Số điện thoại</span>
                <input className="border rounded px-3 py-2" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Địa chỉ</span>
                <input className="border rounded px-3 py-2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button onClick={saveEdit}>Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
