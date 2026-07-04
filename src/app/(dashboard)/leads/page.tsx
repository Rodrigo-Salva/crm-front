'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, Card, Table, Badge, SearchInput, Loading, EmptyState, HealthBadge } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { Modal } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Lead } from '@/modules/shared/types';
import { BatchActionsBar } from '@/modules/shared/components/ui/batch-actions';
import { useSelection } from '@/modules/shared/hooks/use-selection';
import { LeadsKanbanBoard } from '@/modules/leads/components/leads-kanban-board';
import { formatCurrency } from '@/modules/shared/utils/format';

interface PipelineStageOption {
  id: string;
  name: string;
  color?: string;
}

const sourceConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  web: { label: 'Web', variant: 'default' },
  referral: { label: 'Referido', variant: 'success' },
  phone: { label: 'Teléfono', variant: 'primary' },
  email: { label: 'Email', variant: 'warning' },
};

const sourceOptions = [
  { value: '', label: 'Todas las fuentes' },
  { value: 'web', label: 'Web' },
  { value: 'referral', label: 'Referido' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'email', label: 'Email' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('');
  const [stages, setStages] = useState<PipelineStageOption[]>([]);

  const sel = useSelection<Lead>();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const [view, setView] = useState('tabla');

  useEffect(() => {
    api.get<PipelineStageOption[]>('/pipeline-stages').then((res) => setStages(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (customerStatusFilter) params.set('customerStatus', customerStatusFilter);
      const res = await api.get<any>(`/leads?${params}`);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, customerStatusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.delete(`/leads/${id}`)));
      sel.clear();
      load();
    } catch {} finally { setBatchLoading(false); }
  };

  const handleBatchEdit = async () => {
    setBatchSaving(true);
    try {
      await Promise.all(Array.from(sel.selected).map((id) => api.patch(`/leads/${id}`, { status: batchStatus })));
      sel.clear();
      setBatchEditOpen(false);
      load();
    } catch {} finally { setBatchSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Nombre', render: (l: Lead) => (
      <button onClick={() => router.push(`/leads/${l.id}`)} className="flex items-center gap-3 hover:text-[var(--primary)] transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] text-white flex items-center justify-center text-xs font-bold">
          {l.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{l.name}</span>
      </button>
    )},
    { key: 'email', label: 'Email', render: (l: Lead) => <span className="text-[var(--text-secondary)]">{l.email || '—'}</span> },
    { key: 'company', label: 'Empresa', render: (l: Lead) => <span className="text-[var(--text-secondary)]">{l.account?.name || l.companyName || l.company || '—'}</span> },
    { key: 'value', label: 'Valor', render: (l: Lead) => <span className="font-semibold">{l.value ? formatCurrency(l.value, l.currency) : '—'}</span> },
    { key: 'source', label: 'Fuente', render: (l: Lead) => {
      const cfg = sourceConfig[l.source] || { label: l.source || 'Otro', variant: 'default' as const };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    }},
    { key: 'status', label: 'Etapa', render: (l: Lead) => <Badge variant="default">{l.status}</Badge> },
    { key: 'score', label: 'Puntaje', render: (l: Lead) => <span className="font-semibold">{l.score ?? '—'}</span> },
    { key: 'health', label: 'Salud', render: (l: Lead) => l.healthStatus && l.healthStatus !== 'unknown' ? <HealthBadge status={l.healthStatus} score={l.healthScore} /> : <span className="text-[var(--text-secondary)]">—</span> },
    { key: 'owner', label: 'Propietario', render: (l: Lead) => <span className="text-[var(--text-secondary)]">{l.owner?.name || '—'}</span> },
    { key: 'createdAt', label: 'Creado', render: (l: Lead) => <span className="text-[var(--text-secondary)]">{new Date(l.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: '', render: (l: Lead) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => router.push(`/leads/${l.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors" title="Ver detalle">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads"
        description="Gestiona el ciclo de vida completo de tus leads, de prospecto a venta"
        actions={<Button onClick={() => router.push('/leads/create')}>+ Nuevo Lead</Button>}
      />
      <Tabs tabs={[{ id: 'tabla', label: 'Tabla' }, { id: 'kanban', label: 'Kanban' }]} active={view} onChange={setView} />
      {view === 'kanban' ? (
        <div className="mt-4">
          <LeadsKanbanBoard />
        </div>
      ) : (
      <Card padding={false} className="mt-4">
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); }} placeholder="Buscar por nombre, email o empresa..." />
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                <option value="">Todas las etapas</option>
                {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                {sourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={customerStatusFilter}
                onChange={(e) => setCustomerStatusFilter(e.target.value)}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                <option value="">Todos los estados de cliente</option>
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
          </div>
        </div>
        {sel.selected.size > 0 && (
          <BatchActionsBar count={sel.selected.size} onDelete={handleBatchDelete} onClear={sel.clear} onEdit={() => { setBatchStatus(''); setBatchEditOpen(true); }} loading={batchLoading} />
        )}
        {loading ? <Loading /> : data.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No hay leads"
              description="Crea tu primer lead para empezar a gestionar oportunidades."
              action={<Button onClick={() => router.push('/leads/create')}>+ Nuevo Lead</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={data} selected={sel.selected} onToggle={sel.toggle} onToggleAll={() => sel.toggleAll(data)} allSelected={sel.allSelected(data)} />
        )}
      </Card>
      )}

      <Modal open={batchEditOpen} onClose={() => setBatchEditOpen(false)} title={`Editar ${sel.selected.size} leads`}>
        <form onSubmit={(e) => { e.preventDefault(); handleBatchEdit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar etapa a</label>
            <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Seleccionar...</option>
              {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setBatchEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={batchSaving} disabled={!batchStatus}>Actualizar {sel.selected.size} leads</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
