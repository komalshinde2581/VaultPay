import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Users2,
  Building2,
  FileSpreadsheet,
  AlertOctagon,
  ScrollText,
  BarChart3,
  ArrowLeftRight,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Admin Dashboard', to: '/admin', icon: ShieldAlert, end: true },
    { label: 'User Directory', to: '/admin/users', icon: Users2 },
    { label: 'Bank Accounts', to: '/admin/accounts', icon: Building2 },
    { label: 'Transaction Monitor', to: '/admin/transactions', icon: FileSpreadsheet },
    { label: 'Fraud Detection', to: '/admin/fraud-alerts', icon: AlertOctagon },
    { label: 'Audit Trail Logs', to: '/admin/audit-logs', icon: ScrollText },
    { label: 'System Analytics', to: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
              VP
            </div>
            <div>
              <span className="font-bold text-base text-white">Backoffice</span>
              <p className="text-[10px] text-slate-400">Admin Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <NavLink
            to="/dashboard"
            className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Return to Banking</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
