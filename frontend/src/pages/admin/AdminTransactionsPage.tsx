import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { TransactionReceipt } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [reference, setReference] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTransactions(reference || undefined, page, 12);
      setTransactions(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, reference]);

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Transaction Monitoring</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global search across all posted double-entry ledger transfers.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by TX reference..."
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
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
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedReceipt(tx)}
                  className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {tx.reference}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-200">{tx.senderName}</p>
                    <p className="font-mono text-[10px] text-slate-500">{tx.senderAccountNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-200">{tx.receiverName}</p>
                    <p className="font-mono text-[10px] text-slate-500">{tx.receiverAccountNumber}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm">
                    ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800 text-[11px]">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-slate-500">
                    {new Date(tx.completedAt || tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {transactions.length} of {totalElements} transactions</span>
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

      <ReceiptModal
        isOpen={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
