'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, PageHeader, Loading, Card, Table, Modal, Input } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Company } from '@/modules/shared/types';
import { NotesList } from '@/modules/notes/components/notes-list';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { AuditTimeline } from '@/modules/audit/components/audit-timeline';

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'contacts', label: 'Contactos' },
  { id: 'deals', label: 'Negocios' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
  { id: 'audit', label: 'Historial' },
];

const emptyForm = { name: '', industry: '', website: '', phone: '', address: '' };

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Company>(`/companies/${id}`);
      setCompany(res);

      const [contactRes, fieldsRes] = await Promise.all([
        api.get<any>(`/contacts?companyId=${id}`),
        api.get<any>('/custom-fields?entity=company'),
      ]);
      setContacts(Array.isArray(contactRes.data) ? contactRes.data : []);
      setCustomFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  const openEdit = () => {
    if (!company) return;
    setForm({ name: company.name, industry: company.industry || '', website: company.website || '', phone: company.phone || '', address: company.address || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/companies/${id}`, form);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const loadDeals = useCallback(async () => {
    try {
      const res = await api.get<any>(`/deals?companyId=${id}`);
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDeals([]);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'deals') loadDeals();
  }, [activeTab, loadDeals]);

  if (loading) return <Loading />;
  if (!company) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Empresa no encontrada</p>
      <Button className="mt-4" onClick={() => router.push('/companies')}>Volver</Button>
    </div>
  );

  const contactColumns = [
    { key: 'name', label: 'Nombre', render: (c: any) => (
      <Link href={`/contacts/${c.id}`} className="hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{c.name}</span>
      </Link>
    )},
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
  ];

  const dealColumns = [
    { key: 'name', label: 'Nombre', render: (d: any) => (
      <Link href={`/deals/${d.id}`} className="hover:text-[var(--primary)] transition-colors">
        <span className="font-medium">{d.name}</span>
      </Link>
    )},
    { key: 'stage', label: 'Etapa' },
    { key: 'amount', label: 'Monto', render: (d: any) => d.amount ? `$${Number(d.amount).toLocaleString()}` : '—' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/companies')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-lg font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">{company.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{company.industry || 'Sin industria'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/companies/${id}/edit`)}>Editar</Button>
          <Button variant="secondary" onClick={openEdit}>Editar Rápido</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Industria</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{company.industry || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Sitio web</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">{company.website}</a>
                  ) : '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Teléfono</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{company.phone || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Dirección</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{company.address || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Contactos</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{contacts.length} contactos</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Creado</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">
                  {new Date(company.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {customFields.map((field) => (
                <div key={field.name} className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{field.label || field.name}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {company.customFields?.[field.name] || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contactos ({contacts.length})</h3>
              {contacts.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Sin contactos relacionados</p>
              ) : (
                <Table columns={contactColumns} data={contacts} />
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Negocios ({deals.length})</h3>
              {deals.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Sin negocios relacionados</p>
              ) : (
                <Table columns={dealColumns} data={deals} />
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="company" relatedId={company.id} />
          )}

          {activeTab === 'audit' && (
            <AuditTimeline entity="company" entityId={company.id} />
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar Empresa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la empresa" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Industria" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Ej: Tecnología" />
            <Input label="Sitio web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección completa" />
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
