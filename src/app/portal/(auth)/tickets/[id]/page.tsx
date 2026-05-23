'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Card, Badge, Modal, Input } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiGet(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

async function apiPost(path: string, body: any) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  open: { label: 'Abierto', variant: 'success' },
  in_progress: { label: 'En Progreso', variant: 'warning' },
  resolved: { label: 'Resuelto', variant: 'primary' },
  closed: { label: 'Cerrado', variant: 'default' },
};

const priorityBadge: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  low: { label: 'Baja', variant: 'default' },
  medium: { label: 'Media', variant: 'primary' },
  high: { label: 'Alta', variant: 'warning' },
  critical: { label: 'Crítica', variant: 'danger' },
};

export default function PortalTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/tickets/${id}`);
      setTicket(res);
    } catch { router.push('/portal/tickets') }
    finally { setLoading(false) }
  };

  useEffect(() => { load() }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiPost(`/tickets/${id}/messages`, { content: message, isInternal: false });
      setMessage('');
      load();
    } catch {}
    finally { setSending(false) }
  };

  if (loading) return <Loading />;
  if (!ticket) return null;

  const sBadge = statusBadge[ticket.status] || { label: ticket.status, variant: 'default' as const };
  const pBadge = priorityBadge[ticket.priority] || { label: ticket.priority, variant: 'default' as const };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/portal/tickets')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Ticket #{ticket.number}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{ticket.subject}</p>
        </div>
        <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
        <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
      </div>

      {ticket.description && (
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Descripción</h3>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{ticket.description}</p>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Mensajes</h3>
        {!ticket.messages?.length ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-6">Sin mensajes aún</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ticket.messages.map((m: any) => (
              <div key={m.id} className={`p-4 rounded-xl border ${m.author?.isPortal ? 'bg-blue-50 border-blue-200 ml-8' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{m.author?.name || 'Tú'}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">{new Date(m.createdAt).toLocaleString('es-MX')}</span>
                </div>
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              required
              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
            <Button type="submit" loading={sending}>Enviar</Button>
          </form>
        )}
        {(ticket.status === 'closed' || ticket.status === 'resolved') && (
          <p className="text-xs text-[var(--text-secondary)] text-center mt-4">Este ticket está {ticket.status === 'closed' ? 'cerrado' : 'resuelto'}</p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Detalles</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[var(--text-secondary)]">Prioridad:</span> <Badge variant={pBadge.variant}>{pBadge.label}</Badge></div>
          <div><span className="text-[var(--text-secondary)]">Estado:</span> <Badge variant={sBadge.variant}>{sBadge.label}</Badge></div>
          <div><span className="text-[var(--text-secondary)]">Creado:</span> {new Date(ticket.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          {ticket.slaDeadline && (
            <div>
              <span className="text-[var(--text-secondary)]">SLA:</span>{' '}
              <span className={new Date(ticket.slaDeadline) < new Date() ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                {new Date(ticket.slaDeadline).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
