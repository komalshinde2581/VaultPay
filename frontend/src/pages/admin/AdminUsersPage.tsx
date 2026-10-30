import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AdminUser } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Users2, Search, Lock, Unlock, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(query || undefined, page, 10);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, query]);

  const handleStatusChange = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;

    try {
      await adminApi.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">User Directory Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, inspect accounts, and control user access & lockout states.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, user..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Failed Logins</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{u.firstName} {u.lastName}</p>
                    <p className="font-mono text-[11px] text-slate-400">@{u.username}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={u.role} />
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={u.status} />
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <span className={u.failedAttempts > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {u.failedAttempts} / 5
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleStatusChange(u.id, u.status)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        u.status === 'ACTIVE'
                          ? 'border-rose-800 text-rose-400 hover:bg-rose-950/50'
                          : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/50'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Lock User' : 'Unlock / Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {users.length} of {totalElements} users</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-900 cursor-pointer text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 font-semibold">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-900 cursor-pointer text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
