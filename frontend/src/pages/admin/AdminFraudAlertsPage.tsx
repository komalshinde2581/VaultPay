import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FraudAlert } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { AlertOctagon, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const AdminFraudAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Review Modal
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('RESOLVED_FALSE_POSITIVE');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getFraudAlerts(statusFilter || undefined, page, 10);
      setAlerts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, statusFilter]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSubmitting(true);

    try {
      await adminApi.reviewFraudAlert(selectedAlert.id, {
        resolutionStatus,
        resolutionNotes,
      });
      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Fraud Detection & Compliance Triage</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Investigate algorithmic alerts, high-velocity bursts, and risk violations.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Triage States</option>
            <option value="OPEN">Open Only</option>
            <option value="RESOLVED_FALSE_POSITIVE">Resolved (False Positive)</option>
            <option value="RESOLVED_FRAUD">Resolved (Confirmed Fraud)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Triggered Rule</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Flagged User</th>
                <th className="px-6 py-4">Reason & Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reviewed By</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No fraud alerts match the filter.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {a.ruleTriggered}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={a.riskLevel} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      @{a.user?.username}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {a.reason}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px] font-mono">
                      {a.reviewedBy ? `@${a.reviewedBy}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'OPEN' ? (
                        <button
                          onClick={() => setSelectedAlert(a)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          Review & Triage
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {alerts.length} of {totalElements} alerts</span>
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

      {/* Review Alert Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Fraud Alert Compliance Review"
      >
        {selectedAlert && (
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs text-slate-800">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-sm text-slate-900">{selectedAlert.ruleTriggered}</p>
              <p className="text-slate-600 mt-1">{selectedAlert.reason}</p>
              <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                <span>User: @{selectedAlert.user?.username}</span>
                <span>•</span>
                <span>Level: {selectedAlert.riskLevel}</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Resolution Decision</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="RESOLVED_FALSE_POSITIVE">False Positive (Clear Alert)</option>
                <option value="RESOLVED_FRAUD">Confirmed Fraud (Flag for Escalation)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Audit Notes & Findings</label>
              <textarea
                required
                rows={3}
                placeholder="Document verification findings, user interview details, or reasons for clearance..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Record Compliance Finding'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
