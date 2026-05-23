'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/modules/shared/services/api';
import { Button } from '@/modules/shared';

interface CalendarEvent {
  id: string;
  type: string;
  subject: string;
  dueDate: string;
  done: boolean;
  contact?: { id: string; name: string };
  deal?: { id: string; title: string };
}

type ViewMode = 'day' | 'week' | 'month';

const typeIcons: Record<string, string> = {
  call: '📞', meeting: '🤝', email: '📧', note: '📝', task: '✅',
};

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

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
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{title}</h2>
          <Button size="sm" onClick={() => navigate(1)}>→</Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded-md ${view === v ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 py-8">Cargando...</div>
      ) : view === 'month' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="px-3 py-2 text-xs font-medium text-gray-500 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-100 p-1" />
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
                  className={`min-h-[100px] border-r border-b border-gray-100 p-1 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className="text-xs truncate rounded px-1 py-0.5 bg-blue-100 text-blue-800">
                        {typeIcons[e.type]} {e.subject}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} más</div>
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
            <div className="text-gray-400 text-center py-8">Sin actividades en este período</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
                <span className="text-lg">{typeIcons[e.type]}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${e.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{e.subject}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(e.dueDate).toLocaleString('es-ES')}
                    {e.contact && ` · ${e.contact.name}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
