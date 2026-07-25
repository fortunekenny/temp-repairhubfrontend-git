import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api, { API_BASE } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('rh_token')) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }
    refresh();
    const socket = io(API_BASE, { auth: { token } });
    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      toast(`${n.title}\n${n.body || ''}`.trim(), { icon: '🔔', duration: 5000 });
    });
    return () => socket.disconnect();
  }, [token, user, refresh]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      /* non-fatal */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch {
      /* non-fatal */
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
