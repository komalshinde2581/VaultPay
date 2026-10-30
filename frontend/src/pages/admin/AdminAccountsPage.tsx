import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Account } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Building2, Search, Lock, Unlock, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAccounts(query || undefined, page, 10);
      setAccounts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, query]);

  const handleToggleFreeze = async (acc: Account) => {
    const nextStatus = acc.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    if (!window.confirm(`Set account ${acc.accountNumber} status to ${nextStatus}?`)) return;

    try {
      await adminApi.updateAccountStatus(acc.id, nextStatus);
      fetchAccounts();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update account status');
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Bank Accounts Administration</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global ledger accounts review, liquidity balances, and emergency freeze controls.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search account #, holder..."
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
                <th className="px-6 py-4">Account Number</th>
                <th className="px-6 py-4">Account Holder</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Available Balance</th>
                <th className="px-6 py-4">Ledger Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {acc.accountNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-200 font-medium">
                    {acc.accountHolderName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-emerald-400 text-sm">
                    ₹{Number(acc.availableBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    ₹{Number(acc.ledgerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={acc.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleFreeze(acc)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        acc.status === 'ACTIVE'
                          ? 'border-rose-800 text-rose-400 hover:bg-rose-950/50'
                          : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/50'
                      }`}
                    >
                      {acc.status === 'ACTIVE' ? 'Freeze Account' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {accounts.length} of {totalElements} accounts</span>
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
