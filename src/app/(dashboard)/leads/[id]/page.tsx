'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, PageHeader, Card, Loading, Badge, Modal } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { SearchSelect } from '@/modules/shared/components/ui/search-select';
import { Input } from '@/modules/shared/components/ui/input';
import { api } from '@/modules/shared/services/api';
import { Lead } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'Nuevo', variant: 'primary' },
  contacted: { label: 'Contactado', variant: 'warning' },
  qualified: { label: 'Calificado', variant: 'success' },
  converted: { label: 'Convertido', variant: 'info' },
  lost: { label: 'Perdido', variant: 'danger' },
};

const sourceLabels: Record<string, string> = {
  web: 'Web',
  referral: 'Referido',
  phone: 'Teléfono',
  email: 'Correo',
  event: 'Evento',
  partner: 'Socio',
  other: 'Otro',
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [contactId, setContactId] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [converting, setConverting] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Lead>(`/leads/${id}`);
      setLead(res);
    } catch {
      console.error('Error loading lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;
    setConverting(true);
    try {
      await api.post(`/leads/${id}/convert`, { contactId, dealTitle: dealTitle || undefined });
      setConvertModalOpen(false);
      window.location.reload();
    } catch {
      console.error('Error converting lead');
    } finally {
      setConverting(false);
    }
  };

  const handleRecalculateScore = async () => {
    setScoreLoading(true);
    try {
      await api.post(`/leads/${id}/recalculate-score`, {});
      load();
    } catch {
      console.error('Error recalculating score');
    } finally {
      setScoreLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!lead) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Lead no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/leads')}>Volver</Button>
    </div>
  );

  const statusCfg = statusConfig[lead.status] || { label: lead.status, variant: 'default' as const };
  const sourceLabel = sourceLabels[lead.source] || lead.source;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/leads')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{lead.name}</h1>
          </div>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          <Badge variant="default">{sourceLabel}</Badge>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {lead.score}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" loading={scoreLoading} onClick={handleRecalculateScore}>Recalcular Score</Button>
          <Button variant="secondary" onClick={() => setConvertModalOpen(true)}>Convertir</Button>
          <Button onClick={() => router.push(`/leads/${id}/edit`)}>Editar</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Nombre</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Email</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.email || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Teléfono</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.phone || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Empresa</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.company || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Origen</p>
                <p className="mt-1"><Badge variant="default">{sourceLabel}</Badge></p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                <p className="mt-1"><Badge variant={statusCfg.variant}>{statusCfg.label}</Badge></p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Score</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.score}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Notas</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)] whitespace-pre-wrap">{lead.notes || '—'}</p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline contactId={lead.id} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="lead" relatedId={lead.id} />
          )}
        </div>
      </Card>

      <Modal open={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Convertir Lead en Contacto">
        <form onSubmit={handleConvert} className="space-y-4">
          <SearchSelect
            label="Contacto existente"
            value={contactId}
            onChange={(id) => setContactId(id)}
            endpoint="/contacts"
            placeholder="Buscar contacto por nombre..."
            displaySub={(c) => c.email}
          />
          <Input
            label="Título del negocio (opcional)"
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            placeholder="Ej: Seguimiento comercial"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setConvertModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={converting} disabled={!contactId}>Convertir</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
