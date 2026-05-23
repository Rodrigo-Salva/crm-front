'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, PageHeader, Card, Loading, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function EmailInboxPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [replyForm, setReplyForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  const load = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/email/history');
      setEmails(Array.isArray(res) ? res : []);
    } catch {}
    finally { setLoading(false) }
  }, []);

  useEffect(() => { load() }, [load]);

  const syncImap = async () => {
    setSyncing(true);
    try {
      await api.post('/email/imap-sync', {});
      load();
    } catch {}
    finally { setSyncing(false) }
  };

  const handleReply = (email: any) => {
    setReplyForm({
      to: email.direction === 'inbound' ? email.fromEmail : email.toEmail,
      subject: `Re: ${email.subject}`,
      body: `\n\n-------- Mensaje original --------\nDe: ${email.fromEmail}\nAsunto: ${email.subject}\nFecha: ${new Date(email.sentAt).toLocaleString('es-MX')}\n\n${email.body}`,
    });
    setReplyModal(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/email/send', replyForm);
      setReplyModal(false);
    } catch {}
    finally { setSending(false) }
  };

  const filtered = emails.filter((e) => filter === 'all' || e.direction === filter);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Bandeja de Entrada" description={`${emails.length} correos`} />
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(['all', 'inbound', 'outbound'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-[var(--primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'Todos' : f === 'inbound' ? 'Recibidos' : 'Enviados'}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" loading={syncing} onClick={syncImap}>Sincronizar</Button>
        </div>
      </div>

      <div className="flex gap-0 h-[calc(100%-4rem)]">
        <div className="w-96 shrink-0 border-r border-[var(--border)] overflow-y-auto bg-white rounded-l-xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">Sin correos</p>
            </div>
          ) : filtered.map((e) => (
            <div key={e.id}
              onClick={() => setSelected(e)}
              className={`p-4 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-gray-50 ${selected?.id === e.id ? 'bg-blue-50' : ''} ${e.direction === 'inbound' && !e.openedAt ? 'bg-blue-50/30' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[var(--text)] truncate">
                  {e.direction === 'inbound' ? e.fromEmail : `Para: ${e.toEmail}`}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] shrink-0 ml-2">
                  {new Date(e.sentAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--text)] truncate">{e.subject}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] uppercase font-bold px-1 py-0.5 rounded ${e.direction === 'inbound' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {e.direction === 'inbound' ? 'Recibido' : 'Enviado'}
                </span>
                {e.openedAt && <span className="text-[10px] text-green-600">· Abierto</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-r-xl overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-[var(--text-secondary)]">Selecciona un correo para leerlo</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[var(--text)]">{selected.subject}</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleReply(selected)}>
                    {selected.direction === 'inbound' ? 'Responder' : 'Reenviar'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 mb-6 pb-6 border-b border-[var(--border)] text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-secondary)] w-20">De:</span>
                  <span className="font-medium">{selected.fromEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-secondary)] w-20">Para:</span>
                  <span>{selected.toEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-secondary)] w-20">Fecha:</span>
                  <span>{new Date(selected.sentAt).toLocaleString('es-MX')}</span>
                </div>
                {selected.contactId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-20">Contacto:</span>
                    <span className="text-[var(--primary)]">{selected.contact?.name || selected.contactId}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: selected.body }} />
            </div>
          )}
        </div>
      </div>

      <Modal open={replyModal} onClose={() => setReplyModal(false)} title="Responder" size="lg">
        <form onSubmit={handleSendReply} className="space-y-4">
          <Input label="Para" value={replyForm.to} onChange={(e) => setReplyForm({ ...replyForm, to: e.target.value })} required />
          <Input label="Asunto" value={replyForm.subject} onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea value={replyForm.body} onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })} required rows={10} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setReplyModal(false)}>Cancelar</Button>
            <Button type="submit" loading={sending}>Enviar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
