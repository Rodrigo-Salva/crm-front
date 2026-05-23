'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, PageHeader, Loading, Badge, Card, Modal, Input, SearchSelect } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Deal } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';
import { AuditTimeline } from '@/modules/audit/components/audit-timeline';
import { FileAttachments } from '@/modules/uploads/components/file-attachments';
import { formatCurrency, CURRENCIES } from '@/modules/shared/utils/format';

const stageConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  lead: { label: 'Lead', variant: 'default' },
  qualified: { label: 'Calificado', variant: 'primary' },
  proposal: { label: 'Propuesta', variant: 'warning' },
  negotiation: { label: 'Negociación', variant: 'info' },
  closed_won: { label: 'Ganado', variant: 'success' },
  closed_lost: { label: 'Perdido', variant: 'danger' },
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'quotes', label: 'Cotizaciones' },
  { id: 'email', label: 'Correo' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
  { id: 'audit', label: 'Historial' },
  { id: 'files', label: 'Archivos' },
];

const emptyForm = { title: '', value: 0, stage: 'lead', contactId: '', expectedCloseDate: '', currency: 'MXN' as const };

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dealRes, fieldsRes] = await Promise.all([
        api.get<Deal>(`/deals/${id}`),
        api.get<any[]>('/custom-fields?entity=deal').catch(() => []),
      ]);
      setDeal(dealRes);
      setCustomFields(Array.isArray(fieldsRes) ? fieldsRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const openEdit = () => {
    if (!deal) return;
    setForm({ title: deal.title, value: deal.value, stage: deal.stage, contactId: deal.contactId, expectedCloseDate: deal.expectedCloseDate || '', currency: deal.currency });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/deals/${id}`, form);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!deal) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Negocio no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/deals')}>Volver</Button>
    </div>
  );

  const cfg = stageConfig[deal.stage] || { label: deal.stage, variant: 'default' as const };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/deals')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{deal.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{deal.contact?.name || 'Sin contacto'}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-[var(--text)] mr-4">{formatCurrency(deal.value, deal.currency)}</p>
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
          <Button onClick={() => router.push(`/deals/${id}/edit`)}>Editar</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Valor</p>
                  <p className="mt-1 text-lg font-bold text-[var(--text)]">{formatCurrency(deal.value, deal.currency)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Etapa</p>
                  <p className="mt-1"><Badge variant={cfg.variant}>{cfg.label}</Badge></p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Contacto</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{deal.contact?.name || '—'}</p>
                  {deal.contact?.email && <p className="text-xs text-[var(--text-secondary)]">{deal.contact.email}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cierre estimado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {new Date(deal.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {customFields.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Campos personalizados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {customFields.map((f: any) => (
                      <div key={f.id} className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{f.label}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">
                          {deal.customFields?.[f.name] ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'quotes' && <RelatedQuotes dealId={deal.id} />}

          {activeTab === 'email' && <EmailHistory contactId={deal.contactId} />}

          {activeTab === 'activity' && (
            <ActivityTimeline dealId={deal.id} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="deal" relatedId={deal.id} />
          )}

          {activeTab === 'audit' && (
            <AuditTimeline entity="deal" entityId={deal.id} />
          )}

          {activeTab === 'files' && <FileAttachments entity="deal" entityId={deal.id} />}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Negocio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Nombre del negocio" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor" type="number" step="0.01" value={String(form.value)} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="lead">Lead</option><option value="qualified">Calificado</option><option value="proposal">Propuesta</option><option value="negotiation">Negociación</option><option value="closed_won">Ganado</option><option value="closed_lost">Perdido</option>
              </select>
            </div>
            <SearchSelect label="Contacto" value={form.contactId} onChange={(id) => setForm({ ...form, contactId: id })} endpoint="/contacts" placeholder="Buscar contacto por nombre..." displaySub={(c) => c.email} />
            <Input label="Fecha cierre" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RelatedQuotes({ dealId }: { dealId: string }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>(`/quotes?dealId=${dealId}`).then((res: any) => setQuotes(Array.isArray(res) ? res : res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [dealId]);
  if (loading) return <Loading />;
  if (!quotes.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin cotizaciones relacionadas</p>;
  return <div className="space-y-2">{quotes.map((q: any) => <RelatedRow key={q.id} href={`/quotes/${q.id}`} label={q.title || q.name} sub={`${formatCurrency(q.grandTotal, q.currency)} · ${q.status}`} />)}</div>;
}

function EmailHistory({ contactId }: { contactId: string }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any[]>(`/email/history?contactId=${contactId}`).then(setEmails).catch(() => {}).finally(() => setLoading(false));
  }, [contactId]);
  if (loading) return <Loading />;
  if (!emails.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin correos electrónicos</p>;
  return (
    <div className="space-y-3">
      {emails.map((e: any) => (
        <div key={e.id} className="p-4 rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${e.direction === 'outbound' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{e.direction === 'outbound' ? 'Enviado' : 'Recibido'}</span>
              <span className="text-sm font-medium text-[var(--text)]">{e.subject}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{new Date(e.sentAt).toLocaleString('es-MX')}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {e.direction === 'outbound' ? `Para: ${e.toEmail}` : `De: ${e.fromEmail}`}
            {e.openedAt && <span className="ml-2 text-green-600">· Abierto</span>}
          </p>
          <div className="mt-2 text-sm text-[var(--text)] line-clamp-2" dangerouslySetInnerHTML={{ __html: e.body?.substring(0, 200) || '' }} />
        </div>
      ))}
    </div>
  );
}

function RelatedRow({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors border border-[var(--border)]">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <span className="text-xs text-[var(--text-secondary)]">{sub}</span>
    </Link>
  );
}
