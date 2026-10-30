import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AuditLog } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ScrollText, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs(page, 15);
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-2xl font-black">Administrative Audit Trails</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Immutable, tamper-evident logs of backoffice and sensitive operations.
        </p>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Resource Target</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Audit Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">
                    @{log.username || 'system'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-brand-400">
                    {log.resourceType}: {log.resourceId}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                    {log.details || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={log.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {logs.length} of {totalElements} audit entries</span>
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
