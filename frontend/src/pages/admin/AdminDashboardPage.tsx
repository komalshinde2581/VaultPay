import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AdminStats, FraudAlert } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users2,
  Building2,
  FileSpreadsheet,
  AlertOctagon,
  ScrollText,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statData, alertData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getFraudAlerts('OPEN', 0, 5),
        ]);
        setStats(statData);
        setFraudAlerts(alertData.content);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-navy-800 p-8 rounded-3xl border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-rose-400">
            Institutional Oversight
          </span>
          <h1 className="text-3xl font-black mt-1">Backoffice Administration</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time compliance monitoring, user lifecycle control, and automated fraud triage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/fraud-alerts"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Fraud Queue ({stats?.openFraudAlerts || 0})</span>
          </Link>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Platform Liquidity"
          value={`₹${(stats?.systemTotalLiquidity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="System Reserve & Virtual Accounts"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          highlight={true}
        />
        <StatCard
          title="Registered Users"
          value={stats?.totalUsers || 0}
          subtitle="Customers, Administrators, Support"
          icon={<Users2 className="w-5 h-5 text-brand-600" />}
        />
        <StatCard
          title="Active Bank Accounts"
          value={stats?.totalAccounts || 0}
          subtitle="Checking, Savings & Business"
          icon={<Building2 className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Settled Transactions"
          value={stats?.totalTransactions || 0}
          subtitle="Immutable ledger transactions"
          icon={<FileSpreadsheet className="w-5 h-5 text-cyan-600" />}
        />
        <StatCard
          title="Open Fraud Alerts"
          value={stats?.openFraudAlerts || 0}
          subtitle="Heuristic and velocity triggers"
          icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title="Audit Trail Logs"
          value={stats?.totalAuditLogs || 0}
          subtitle="Tamper-evident administrative audit"
          icon={<ScrollText className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Open Fraud Alerts Section */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="font-bold text-base text-white">Pending Fraud Triage Queue</h3>
              <p className="text-xs text-slate-400">Transactions flagged by rule engine requiring compliance review</p>
            </div>
          </div>
          <Link
            to="/admin/fraud-alerts"
            className="text-xs font-semibold text-rose-400 hover:underline flex items-center space-x-1"
          >
            <span>Open queue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Triggered Rule</th>
                <th className="px-6 py-3.5">Risk Level</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Reason & Description</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {fraudAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No open fraud alerts. System risk score: NORMAL.
                  </td>
                </tr>
              ) : (
                fraudAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-white">
                      {alert.ruleTriggered}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={alert.riskLevel} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      @{alert.user?.username}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-sm truncate">
                      {alert.reason}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={alert.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
