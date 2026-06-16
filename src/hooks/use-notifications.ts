import { useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  type AppNotification,
} from "@/services/notification.service";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: number) => {
    // Hapus dari UI langsung tanpa tunggu API
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const notif = notifications.find((n) => n.id === id);
      return notif && !notif.is_read ? Math.max(0, prev - 1) : prev;
    });

    // Hit API di background
    try {
      await deleteNotification(id);
    } catch (e) {
      console.error("Delete notification failed:", e);
      // Kalau gagal, fetch ulang untuk sinkronisasi
      fetch();
    }
  }


  useEffect(() => {
    fetch();
    // Polling setiap 30 detik
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { notifications, unreadCount, loading, fetch, handleMarkRead, handleMarkAllRead, handleDelete };
}