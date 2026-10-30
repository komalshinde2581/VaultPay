import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import { CategorySpending, DailySpending, FinancialSummary, MonthlyTrend } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { ArrowDownLeft, ArrowUpRight, DollarSign, PieChart as PieIcon, Activity } from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const SpendingAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DailySpending[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sumData, trends, cats, daily] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getMonthlyTrends(),
          analyticsApi.getCategories(),
          analyticsApi.getDailySpending(14),
        ]);
        setSummary(sumData);
        setMonthlyTrends(trends);
        setCategories(cats);
        setDailySpending(daily);
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
      <div>
        <h1 className="text-2xl font-black text-slate-900">Financial & Spending Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed insights into cash flow, spending categories, and transaction volume.
        </p>
      </div>

      {/* High-level Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Net Cash Flow"
          value={`₹${(summary?.netCashFlow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Incoming minus Outgoing"
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
          highlight={true}
        />
        <StatCard
          title="Total Inflow"
          value={`₹${(summary?.totalIncoming || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="All received transfers"
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Outflow"
          value={`₹${(summary?.totalOutgoing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="All sent payments"
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title="Settlement Rate"
          value={`${summary?.successRate || 100}%`}
          subtitle={`${summary?.totalTransactions || 0} Ledger executions`}
          icon={<Activity className="w-5 h-5 text-brand-600" />}
        />
      </div>

      {/* Row: Monthly Comparison Bar Chart & Expense Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Monthly Volume Comparison</h3>
            <p className="text-xs text-slate-400 mt-0.5">Incoming deposits vs Outgoing payments by month</p>
          </div>

          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="incoming" name="Inflow (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outgoing" name="Outflow (₹)" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800">Spending by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown of outgoing transactions</p>
          </div>

          <div className="h-80 w-full mt-4 flex items-center justify-center">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No outgoing expenses recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Daily Spending Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-base text-slate-800">Daily Spending Activity (Past 14 Days)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Track day-to-day transaction volumes</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySpending}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#dailyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
