'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/modules/shared/services/api';
import { Button } from '@/modules/shared';

interface CalendarEvent {
  id: string;
  type: string;
  subject: string;
  dueDate: string;
  done: boolean;
  isTask?: boolean;
  lead?: { id: string; name: string };
}

type ViewMode = 'day' | 'week' | 'month';

export function CalendarView() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const openEvent = (e: CalendarEvent) => {
    if (e.isTask) router.push(`/tasks/${e.id}/edit`);
    else if (e.lead) router.push(`/leads/${e.lead.id}`);
  };

  const getRange = useCallback(() => {
    const d = new Date(currentDate);
    if (view === 'day') {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (view === 'week') {
      const day = d.getDay();
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
      const end = new Date(start.getTime() + 7 * 86400000);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [currentDate, view]);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange();
    try {
      const res = await api.get<CalendarEvent[]>(`/activities/calendar?from=${from}&to=${to}`);
      setEvents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getRange]);

  useEffect(() => { load() }, [load]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const title = currentDate.toLocaleDateString('es-ES', {
    month: 'long', year: 'numeric',
    ...(view === 'day' ? { day: 'numeric' } : {}),
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const getEventsForDay = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.dueDate);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button size="sm" onClick={() => navigate(-1)}>←</Button>
          <h2 className="text-lg font-semibold text-white capitalize">{title}</h2>
          <Button size="sm" onClick={() => navigate(1)}>→</Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
        </div>
        <div className="flex gap-1 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${view === v ? 'bg-[var(--primary)] text-white shadow-sm font-medium' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--sidebar-hover)]'}`}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 py-8">Cargando...</div>
      ) : view === 'month' ? (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200">
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-[var(--border)] p-1 bg-[var(--bg)]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();
              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-r border-b border-[var(--border)] p-1 transition-colors hover:bg-[var(--sidebar-hover)] ${isToday ? 'bg-[var(--primary-light)]' : 'bg-[var(--bg)]'}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => openEvent(e)}
                        className={`w-full text-left text-xs truncate rounded px-1.5 py-0.5 border transition-colors hover:brightness-110 ${
                          e.isTask
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-[var(--primary-light)] border-[var(--primary)]/30 text-white'
                        }`}
                      >
                        {e.subject}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-[var(--text-muted)] px-1">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-gray-400 text-center py-8">Sin actividades o tareas en este período</div>
          ) : (
            events.map((e) => (
              <button
                key={e.id}
                onClick={() => openEvent(e)}
                className="w-full flex items-center gap-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-150 hover:-translate-y-[1px] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] p-4 text-left"
              >
                <div className="flex-1">
                  <p className={`text-sm font-medium ${e.done ? 'line-through text-[var(--text-muted)]' : 'text-white'}`}>{e.subject}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(e.dueDate).toLocaleString('es-ES')}
                    {e.lead && ` · ${e.lead.name}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
