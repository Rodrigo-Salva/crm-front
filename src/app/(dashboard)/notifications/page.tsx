'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, PageHeader, Card, Loading, EmptyState } from '@/modules/shared';
import { notificationApi, Notification } from '@/modules/notifications/services/notification-api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.list();
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load() }, [load]);

  const markAll = async () => {
    await notificationApi.markAllAsRead();
    load();
  };

  const markOne = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notificaciones"
        actions={
          notifications.length > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll}>Marcar todo como leÃ­do</Button>
          )
        }
      />

      {loading ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="Sin notificaciones"
            description="No tienes notificaciones pendientes"
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markOne(n.id)}
              className={`rounded-lg border cursor-pointer transition-all duration-150 animate-fade-in ${
                n.read
                  ? 'bg-[var(--card-bg)] border-[var(--border)]'
                  : 'bg-blue-50/50 border-[var(--primary)]/30 shadow-sm'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-[var(--primary)]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-gray-600' : 'font-semibold text-[var(--text)]'}`}>{n.title}</p>
                    {n.body && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{n.body}</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">{new Date(n.createdAt).toLocaleString('es-ES')}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

