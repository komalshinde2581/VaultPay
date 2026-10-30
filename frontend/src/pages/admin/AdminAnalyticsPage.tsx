import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { analyticsApi } from '../../api/analyticsApi';
import { AdminStats, MonthlyTrend } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DollarSign, ShieldCheck, Users2, Activity } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statData, trendData] = await Promise.all([
          adminApi.getStats(),
          analyticsApi.getMonthlyTrends(),
        ]);
        setStats(statData);
        setTrends(trendData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-2xl font-black">Platform-Wide Financial Intelligence</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Aggregate platform liquidity, settlement volume, and double-entry reconciliation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="System Reserve Liquidity"
          value={`₹${(stats?.systemTotalLiquidity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="VaultPay Total Managed Capital"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          highlight={true}
        />
        <StatCard
          title="Active Accounts"
          value={stats?.totalAccounts || 0}
          subtitle="Retail & Commercial"
          icon={<Users2 className="w-5 h-5 text-brand-600" />}
        />
        <StatCard
          title="Ledger Transactions"
          value={stats?.totalTransactions || 0}
          subtitle="100% Balanced Double-Entry"
          icon={<ShieldCheck className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          title="Flagged Alerts"
          value={stats?.openFraudAlerts || 0}
          subtitle="Awaiting Compliance"
          icon={<Activity className="w-5 h-5 text-rose-500" />}
        />
      </div>

      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="mb-6">
          <h3 className="font-bold text-base text-white">System Transaction Volume Across All Accounts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Aggregate incoming and outgoing settlement velocity</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', color: '#fff', border: '1px solid #1e293b', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="incoming" name="Total Inflow (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="outgoing" name="Total Outflow (₹)" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
