'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { notificationApi } from '../services/notification-api';

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.unreadCount();
      setCount(typeof res === 'number' ? res : 0);
    } catch { setCount(0) }
  }, []);

  useEffect(() => { load() }, [load]);
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv) }, [load]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    let userId: string | undefined;
    try { userId = JSON.parse(storedUser).id; } catch { return; }
    if (!userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const socket = io(socketUrl);

    socket.on('connect', () => socket.emit('joinUser', { userId }));
    socket.on('notification:new', (notification: { title: string }) => {
      setCount((c) => c + 1);
      toast.info(notification.title);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <button className="relative p-2 rounded-lg text-gray-400 hover:text-[var(--celeste-600)] hover:bg-[var(--sidebar-hover)] transition-colors" onClick={() => router.push('/notifications')}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
