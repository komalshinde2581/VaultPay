import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '../types';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  latestAlert: NotificationItem | null;
  clearLatestAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestAlert, setLatestAlert] = useState<NotificationItem | null>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getNotifications(0, 10);
      setNotifications(data.content);
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notifications?token=${token}`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[WebSocket] Real-time notifications connected');
        };

        socket.onmessage = (event) => {
          try {
            const newItem: NotificationItem = JSON.parse(event.data);
            setNotifications((prev) => [newItem, ...prev]);
            setUnreadCount((prev) => prev + 1);
            setLatestAlert(newItem);
          } catch (err) {
            console.error('Error parsing WS message', err);
          }
        };

        socket.onclose = () => {
          console.log('[WebSocket] Connection closed. Retrying in 5s...');
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        socket.onerror = (err) => {
          console.warn('[WebSocket] Error occurred', err);
          socket?.close();
        };
      } catch (err) {
        console.warn('[WebSocket] Setup exception', err);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null; // Prevent reconnect on unmount
        socket.close();
      }
    };
  }, [isAuthenticated, token]);

  const markAsRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearLatestAlert = () => setLatestAlert(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
        latestAlert,
        clearLatestAlert,
      }}
    >
      {children}
      {/* Toast Alert Pop-up */}
      {latestAlert && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-brand-500/40 text-white p-4 rounded-xl shadow-2xl flex items-start space-x-3 max-w-md animate-bounce">
          <div className="h-3 w-3 mt-1.5 rounded-full bg-emerald-400 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-slate-100">{latestAlert.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{latestAlert.message}</p>
          </div>
          <button
            onClick={clearLatestAlert}
            className="text-slate-400 hover:text-white text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
