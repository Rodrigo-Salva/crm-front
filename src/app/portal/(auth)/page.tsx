'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Loading, Badge } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiGet(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export default function PortalDashboardPage() {
  const [contact, setContact] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('portal_contact');
    if (stored) setContact(JSON.parse(stored));
    Promise.all([
      apiGet('/tickets').catch(() => []),
      apiGet('/quotes').catch(() => []),
    ]).then(([t, q]) => {
      setTickets(Array.isArray(t) ? t : []);
      setQuotes(Array.isArray(q) ? q : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
  const openQuotes = quotes.filter((q: any) => q.status === 'draft' || q.status === 'sent');

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          Bienvenido{contact?.name ? `, ${contact.name}` : ''}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Resumen de tu actividad</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">{tickets.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Total tickets</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">{openTickets.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Tickets abiertos</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text)]">{openQuotes.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Cotizaciones pendientes</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Tickets recientes</h3>
            <Link href="/portal/tickets" className="text-xs text-[var(--primary)] hover:underline">Ver todos</Link>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-6">Sin tickets</p>
          ) : (
            <div className="space-y-2">
              {tickets.slice(0, 5).map((t: any) => (
                <Link key={t.id} href={`/portal/tickets/${t.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sidebar-hover)] border border-[var(--border)] transition-colors">
                  <div>
                    <span className="text-xs font-mono text-[var(--primary)]">#{t.number}</span>
                    <p className="text-sm font-medium text-[var(--text)]">{t.subject}</p>
                  </div>
                  <Badge variant={t.status === 'open' ? 'success' : t.status === 'in_progress' ? 'warning' : t.status === 'resolved' ? 'primary' : 'default'}>
                    {t.status === 'open' ? 'Abierto' : t.status === 'in_progress' ? 'En Progreso' : t.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Cotizaciones recientes</h3>
            <Link href="/portal/quotes" className="text-xs text-[var(--primary)] hover:underline">Ver todas</Link>
          </div>
          {quotes.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-6">Sin cotizaciones</p>
          ) : (
            <div className="space-y-2">
              {quotes.slice(0, 5).map((q: any) => (
                <Link key={q.id} href={`/portal/quotes/${q.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sidebar-hover)] border border-[var(--border)] transition-colors">
                  <div>
                    <span className="text-xs font-mono text-[var(--text)]">{q.number}</span>
                    <p className="text-sm font-medium text-[var(--text)]">${q.grandTotal?.toLocaleString()}</p>
                  </div>
                  <Badge variant={q.status === 'approved' ? 'success' : q.status === 'rejected' ? 'danger' : q.status === 'sent' ? 'primary' : 'default'}>
                    {q.status === 'draft' ? 'Borrador' : q.status === 'sent' ? 'Enviada' : q.status === 'approved' ? 'Aprobada' : q.status === 'rejected' ? 'Rechazada' : q.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
