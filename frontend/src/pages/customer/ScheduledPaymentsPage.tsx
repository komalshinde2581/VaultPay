import React, { useEffect, useState } from 'react';
import { scheduledApi } from '../../api/scheduledApi';
import { accountApi } from '../../api/accountApi';
import { Account, ScheduledPayment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CalendarClock, Plus, Trash2, Play, AlertCircle, Clock } from 'lucide-react';

export const ScheduledPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [targetAccount, setTargetAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [recurrence, setRecurrence] = useState<string>('MONTHLY');
  const [executionDate, setExecutionDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [scheds, accs] = await Promise.all([
        scheduledApi.getScheduledPayments(),
        accountApi.getMyAccounts(),
      ]);
      setPayments(scheds);
      setAccounts(accs);
      if (accs.length > 0 && !sourceAccount) {
        setSourceAccount(accs[0].accountNumber);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // Default tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setExecutionDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await scheduledApi.createScheduledPayment({
        sourceAccountNumber: sourceAccount,
        targetAccountNumber: targetAccount,
        amount: parseFloat(amount),
        recurrenceType: recurrence,
        executionDate,
        description,
      });
      setModalOpen(false);
      setAmount('');
      setTargetAccount('');
      setDescription('');
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this scheduled payment?')) return;
    try {
      await scheduledApi.cancelScheduledPayment(id);
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleTriggerCycle = async () => {
    try {
      await scheduledApi.triggerRun();
      alert('Triggered scheduled execution cycle! Any due payments have been evaluated.');
      fetchPayments();
    } catch (e) {
      alert('Error triggering execution');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Scheduled & Recurring Payments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automate future transfers and recurring bills using Spring Boot Scheduler.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerCycle}
            title="Execute due payments now"
            className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>Run Due Cycle</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Payment</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Target Account</th>
                <th className="px-6 py-4">Source Account</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Frequency</th>
                <th className="px-6 py-4">Next Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No scheduled payments found. Automate your first recurring transfer above!
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-800">{p.targetAccountNumber}</p>
                      {p.description && <p className="text-[11px] text-slate-400">{p.description}</p>}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {p.sourceAccountNumber}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.recurrenceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 flex items-center space-x-1 mt-3">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.nextExecutionDate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancel(p.id)}
                          className="text-rose-500 hover:text-rose-700 font-semibold p-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule New Payment">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Source Account</label>
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.accountNumber}>
                  {a.accountType} ({a.accountNumber}) - ₹{Number(a.availableBalance).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Destination Account Number</label>
            <input
              type="text"
              required
              placeholder="e.g. VP-2000201"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Amount (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Frequency</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ONCE">One-Time (Future Date)</option>
                <option value="WEEKLY">Weekly Recurring</option>
                <option value="MONTHLY">Monthly Recurring</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">First Execution Date</label>
            <input
              type="date"
              required
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Memo / Purpose (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Monthly rent allowance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
