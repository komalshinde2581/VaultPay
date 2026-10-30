import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity, Lock, RefreshCw, BarChart, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-black text-xl shadow-lg shadow-brand-500/30">
            V
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Vault<span className="text-brand-400">Pay</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
          >
            Open Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-20 pb-28 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8">
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-ping" />
          <span>Next-Generation Financial Ledger Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
          Simulated Banking. <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-brand-200 bg-clip-text text-transparent">
            Institutional Precision.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Experience a full-stack digital banking simulation with immutable double-entry ledger bookkeeping,
          idempotent payment rails, pessimistic concurrency locking, and real-time fraud mitigation.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <span>Launch Virtual Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Access Demo Logins</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-6">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Double-Entry Ledger</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every financial transfer strictly enforces Total Debit = Total Credit with immutable audit records and BigDecimal precision.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pessimistic Concurrency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deterministic row-level locking ensures zero negative balances or overspending during simultaneous concurrent withdrawals.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Rule-Based Fraud Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detects unusual payment volumes, rapid burst frequencies, and cooling-period violations before funds transfer.
            </p>
          </div>
        </div>

        {/* Demo Credentials Quick Reference */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-left max-w-3xl mx-auto">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
            <span>Preloaded Demo Credentials (Password: Password123!)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="font-semibold text-white block">Alex Mercer</span>
              <span className="text-slate-400">alex (Customer)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="font-semibold text-white block">Sarah Connor</span>
              <span className="text-slate-400">sarah (Customer)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="font-semibold text-white block">Chief Admin</span>
              <span className="text-slate-400">admin (Administrator)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
