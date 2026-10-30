import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { accountApi } from '../../api/accountApi';
import { transferApi } from '../../api/transferApi';
import { analyticsApi } from '../../api/analyticsApi';
import { Account, FinancialSummary, MonthlyTrend, TransactionReceipt } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Send,
  CreditCard,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionReceipt[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Transfer State
  const [quickSource, setQuickSource] = useState<string>('');
  const [quickTarget, setQuickTarget] = useState<string>('');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickSubmitting, setQuickSubmitting] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accs, sumData, txData, trends] = await Promise.all([
        accountApi.getMyAccounts(),
        analyticsApi.getSummary(),
        transferApi.getTransactions({ page: 0, size: 5 }),
        analyticsApi.getMonthlyTrends(),
      ]);

      setAccounts(accs);
      if (accs.length > 0 && !quickSource) {
        setQuickSource(accs[0].accountNumber);
      }
      setSummary(sumData);
      setRecentTransactions(txData.content);
      setMonthlyTrends(trends);
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    setQuickSuccess(null);
    setQuickSubmitting(true);

    try {
      const res = await transferApi.executeTransfer({
        sourceAccountNumber: quickSource,
        destinationAccountNumber: quickTarget,
        amount: parseFloat(quickAmount),
        description: 'Quick P2P Transfer',
      });
      setQuickSuccess(`Transferred ₹${quickAmount} successfully! Ref: ${res.transactionReference}`);
      setQuickAmount('');
      setQuickTarget('');
      loadDashboardData();
    } catch (err: any) {
      setQuickError(err.response?.data?.message || 'Transfer failed. Check balance & account number.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-navy-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-brand-400">
            Digital Banking Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Simulated accounts secured with double-entry ledger & real-time fraud monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/send-money"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold text-xs sm:text-sm text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span>Send Money</span>
          </Link>
          <button
            onClick={loadDashboardData}
            title="Refresh balance"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Available Funds"
          value={`₹${(summary?.totalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={primaryAccount ? `Primary: ${primaryAccount.accountNumber}` : 'Active Accounts'}
          icon={<Wallet className="w-5 h-5 text-brand-600" />}
          highlight={true}
        />
        <StatCard
          title="Incoming Funds"
          value={`₹${(summary?.totalIncoming || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Lifetime deposits & received"
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
          trend={{ value: '100% Verified', isPositive: true }}
        />
        <StatCard
          title="Outgoing Transfers"
          value={`₹${(summary?.totalOutgoing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Processed transfers"
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title="Transaction Success"
          value={`${summary?.successRate || 100}%`}
          subtitle={`${summary?.totalTransactions || 0} total ledger executions`}
          icon={<TrendingUp className="w-5 h-5 text-brand-600" />}
        />
      </div>

      {/* Two Column Section: Chart + Quick Transfer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Financial Cashflow Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800">Income vs. Outgoing Cash Flow</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculated from immutable double-entry ledger records</p>
            </div>
            <Link to="/analytics" className="text-xs text-brand-600 font-semibold hover:underline flex items-center space-x-1">
              <span>View full analytics</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="incomingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outgoingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="incoming" name="Incoming" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomingGrad)" />
                <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#outgoingGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Transfer Action Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-800 mb-1">
              <Send className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-base">Quick Transfer</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Instant simulated transfer by account number</p>

            {quickError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {quickSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {quickSuccess}
              </div>
            )}

            <form onSubmit={handleQuickTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">From Account</label>
                <select
                  value={quickSource}
                  onChange={(e) => setQuickSource(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountType} ({acc.accountNumber}) - ₹{Number(acc.availableBalance).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VP-2000201"
                  value={quickTarget}
                  onChange={(e) => setQuickTarget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {quickSubmitting ? 'Processing Transaction...' : 'Transfer Funds Now'}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Idempotency Protected</span>
            <span className="font-mono text-emerald-600 font-medium">✓ No Double-Spend</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any transaction to view official ledger receipt</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center space-x-1"
          >
            <span>View All History</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Counterparty</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No transactions recorded yet. Send your first payment above!
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncoming = tx.receiverName.toLowerCase().includes(user?.firstName?.toLowerCase() || '');
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedReceipt(tx)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {tx.reference}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-medium max-w-xs truncate">
                        {tx.description || 'Transfer'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {isIncoming ? `From: ${tx.senderName}` : `To: ${tx.receiverName}`}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={isIncoming ? 'text-emerald-600' : 'text-slate-900'}>
                          {isIncoming ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={tx.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(tx.completedAt || tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
