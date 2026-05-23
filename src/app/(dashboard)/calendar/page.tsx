'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarView } from '@/modules/calendar/components/calendar-view';
import { PageHeader, Card, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

function TasksOnCalendar() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>('/tasks?limit=10').then((res: any) => {
      const items = Array.isArray(res) ? res : res?.data || [];
      setTasks(items.filter((t: any) => t.dueDate));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  return (
    <Card>
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Próximas tareas</h3>
      {tasks.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">Sin tareas con fecha</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t: any) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-[var(--text)]">{t.title}</span>
              <span className={`text-xs ${t.dueDate && new Date(t.dueDate) < new Date() ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                {new Date(t.dueDate).toLocaleDateString('es-MX')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function CalendarPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Calendario"
        description="Gestiona tus actividades y eventos"
      />
      <Card padding={false}>
        <CalendarView />
      </Card>
      <TasksOnCalendar />
    </div>
  );
}
