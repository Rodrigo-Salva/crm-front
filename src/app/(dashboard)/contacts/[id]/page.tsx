'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, PageHeader, Loading, Badge, Card, Modal, Input } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Contact } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';
import { AuditTimeline } from '@/modules/audit/components/audit-timeline';
import { FileAttachments } from '@/modules/uploads/components/file-attachments';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'Nuevo', variant: 'primary' },
  contacted: { label: 'Contactado', variant: 'warning' },
  qualified: { label: 'Calificado', variant: 'success' },
  lost: { label: 'Perdido', variant: 'danger' },
};

const emptyForm = { name: '', email: '', phone: '', companyName: '', position: '', status: 'new' };

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callDirection, setCallDirection] = useState('incoming');
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalPassword, setPortalPassword] = useState('');
  const [portalEnabling, setPortalEnabling] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contactRes, fieldsRes] = await Promise.all([
        api.get<Contact>(`/contacts/${id}`),
        api.get<any[]>('/custom-fields?entity=contact').catch(() => []),
      ]);
      setContact(contactRes);
      setCustomFields(Array.isArray(fieldsRes) ? fieldsRes : []);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    if (!contact) return;
    setForm({ name: contact.name, email: contact.email, phone: contact.phone || '', companyName: contact.companyName || '', position: contact.position || '', status: contact.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/contacts/${id}`, form);
      setModalOpen(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      await api.post('/email/send', emailForm);
      setEmailModalOpen(false);
      setEmailForm({ to: '', subject: '', body: '' });
    } catch {} finally { setSendingEmail(false); }
  };

  const openEmailCompose = (to?: string) => {
    setEmailForm({ to: to || contact?.email || '', subject: '', body: '' });
    setEmailModalOpen(true);
  };

  if (loading) return <Loading />;
  if (!contact) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Contacto no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/contacts')}>Volver</Button>
    </div>
  );

  const cfg = statusConfig[contact.status] || { label: contact.status, variant: 'default' as const };

  const tabOptions = [
    { id: 'info', label: 'Información' },
    { id: 'deals', label: 'Negocios' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'quotes', label: 'Cotizaciones' },
    { id: 'email', label: 'Correo' },
    { id: 'activity', label: 'Actividad' },
    { id: 'notes', label: 'Notas' },
    { id: 'audit', label: 'Historial' },
    { id: 'files', label: 'Archivos' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/contacts')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] text-white flex items-center justify-center text-lg font-bold">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">{contact.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{contact.position || 'Sin cargo'}</p>
            </div>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
          <Button variant="secondary" onClick={() => openEmailCompose()}>Enviar Correo</Button>
          <Button variant="secondary" onClick={() => { setPortalPassword(''); setPortalModalOpen(true); }}>Portal</Button>
          <Button onClick={() => router.push(`/contacts/${id}/edit`)}>Editar</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { label: 'Email', value: contact.email },
                  { label: 'Teléfono', value: contact.phone || '—' },
                  { label: 'Empresa', value: contact.companyName || '—' },
                  { label: 'Cargo', value: contact.position || '—' },
                  { label: 'Estado', value: <Badge variant={cfg.variant}>{cfg.label}</Badge> },
                  { label: 'Creado', value: new Date(contact.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map((f) => (
                  <div key={f.label} className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{f.label}</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{f.value}</p>
                  </div>
                ))}
              </div>
              {customFields.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Campos personalizados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {customFields.map((f: any) => (
                      <div key={f.id} className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{f.label}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">
                          {contact.customFields?.[f.name] ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'deals' && <RelatedDeals contactId={contact.id} />}
          {activeTab === 'tickets' && <RelatedTickets contactId={contact.id} />}
          {activeTab === 'quotes' && <RelatedQuotes contactId={contact.id} />}
          {activeTab === 'email' && <EmailHistory contactId={contact.id} onCompose={() => openEmailCompose(contact.email)} />}
          {activeTab === 'activity' && (
            <>
              <div className="flex justify-end mb-3">
                <Button size="sm" onClick={() => setCallModalOpen(true)}>+ Registrar llamada</Button>
              </div>
              <ActivityTimeline contactId={contact.id} />
              <Modal open={callModalOpen} onClose={() => setCallModalOpen(false)} title="Registrar llamada">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await api.post('/activities', { type: 'call', description: callNotes, contactId: contact.id, direction: callDirection });
                  setCallNotes('');
                  setCallDirection('incoming');
                  setCallModalOpen(false);
                  window.location.reload();
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <select value={callDirection} onChange={(e) => setCallDirection(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
                      <option value="incoming">Entrante</option>
                      <option value="outgoing">Saliente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" type="button" onClick={() => setCallModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                  </div>
                </form>
              </Modal>
            </>
          )}
          {activeTab === 'notes' && <NotesList relatedType="contact" relatedId={contact.id} />}
          {activeTab === 'audit' && <AuditTimeline entity="contact" entityId={contact.id} />}
          {activeTab === 'files' && <FileAttachments entity="contact" entityId={contact.id} />}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Contacto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre completo" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="correo@ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Empresa" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Nombre de empresa" />
            <Input label="Cargo" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej: CEO" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="qualified">Calificado</option><option value="lost">Perdido</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Redactar Correo" size="lg">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input label="Para" type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} required placeholder="destinatario@ejemplo.com" />
          <Input label="Asunto" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} required placeholder="Asunto del correo" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} required rows={8} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400" placeholder="Escribe tu mensaje..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setEmailModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={sendingEmail}>Enviar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={portalModalOpen} onClose={() => setPortalModalOpen(false)} title="Acceso al Portal del Cliente">
        <form onSubmit={async (e) => {
          e.preventDefault();
          setPortalEnabling(true);
          try {
            await api.patch(`/auth/contacts/${id}/portal-access`, { password: portalPassword, enable: true });
            setPortalModalOpen(false);
            setPortalPassword('');
          } catch {}
          finally { setPortalEnabling(false); }
        }} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Configura una contraseña para que {contact.name} pueda acceder al portal del cliente.</p>
          <Input label="Contraseña de acceso" type="text" value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" minLength={8} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setPortalModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={portalEnabling}>Habilitar Portal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RelatedDeals({ contactId }: { contactId: string }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>(`/deals?contactId=${contactId}`).then((res: any) => setDeals(Array.isArray(res) ? res : res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [contactId]);
  if (loading) return <Loading />;
  if (!deals.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin negocios relacionados</p>;
  return <div className="space-y-2">{deals.map((d: any) => <RelatedRow key={d.id} href={`/deals/${d.id}`} label={d.title} sub={`$${d.value?.toLocaleString()} · ${d.stage}`} />)}</div>;
}

function RelatedTickets({ contactId }: { contactId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>(`/tickets?contactId=${contactId}`).then((res: any) => setTickets(Array.isArray(res) ? res : res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [contactId]);
  if (loading) return <Loading />;
  if (!tickets.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin tickets relacionados</p>;
  return <div className="space-y-2">{tickets.map((t: any) => <RelatedRow key={t.id} href={`/tickets/${t.id}`} label={t.subject || t.title} sub={t.status} />)}</div>;
}

function RelatedQuotes({ contactId }: { contactId: string }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>(`/quotes?contactId=${contactId}`).then((res: any) => setQuotes(Array.isArray(res) ? res : res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [contactId]);
  if (loading) return <Loading />;
  if (!quotes.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin cotizaciones relacionadas</p>;
  return <div className="space-y-2">{quotes.map((q: any) => <RelatedRow key={q.id} href={`/quotes/${q.id}`} label={q.title || q.name} sub={`$${q.total?.toLocaleString() || '0'} · ${q.status}`} />)}</div>;
}

function RelatedRow({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors border border-[var(--border)]">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <span className="text-xs text-[var(--text-secondary)]">{sub}</span>
    </Link>
  );
}

function EmailHistory({ contactId, onCompose }: { contactId: string; onCompose: () => void }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any[]>(`/email/history?contactId=${contactId}`).then(setEmails).catch(() => {}).finally(() => setLoading(false));
  }, [contactId]);
  if (loading) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Historial de correos</h3>
        <Button size="sm" onClick={onCompose}>Redactar</Button>
      </div>
      {!emails.length ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">Sin correos electrónicos</p>
      ) : emails.map((e: any) => (
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
