import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/common/Badge';
import { Bell, CheckCheck, Clock, ArrowDownLeft, ArrowUpRight, ShieldAlert, Check } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'TRANSFER_RECEIVED':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />;
      case 'TRANSFER_SENT':
        return <ArrowUpRight className="w-5 h-5 text-brand-600" />;
      case 'FRAUD_ALERT':
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications & Alerts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time event stream powered by Spring WebSocket.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-1">You will receive live alerts when transfers or security events occur.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-6 flex items-start justify-between space-x-4 transition-colors ${
                !n.read ? 'bg-brand-50/30' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                  {getIconForType(n.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </span>
                    {n.referenceId && (
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                        Ref: {n.referenceId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  title="Mark as read"
                  className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white border border-slate-200 text-xs flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
