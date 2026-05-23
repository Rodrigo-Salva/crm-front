'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/modules/deals/components/kanban-board';
import { PageHeader, Table, Button, Card, Loading } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import Link from 'next/link';
import { Badge } from '@/modules/shared';

const stageMap: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  lead: { label: 'Lead', variant: 'info' },
  qualified: { label: 'Calificado', variant: 'primary' },
  proposal: { label: 'Propuesta', variant: 'warning' },
  negotiation: { label: 'Negociación', variant: 'warning' },
  closed_won: { label: 'Ganado', variant: 'success' },
  closed_lost: { label: 'Perdido', variant: 'danger' },
};

const fmt = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState('kanban');
  const [deals, setDeals] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stagesRes, dealsRes] = await Promise.all([
          api.get<any>('/dashboard/deals-by-stage'),
          api.get<any>('/deals'),
        ]);
        setStages(Array.isArray(stagesRes) ? stagesRes : stagesRes.data ?? []);
        setDeals(Array.isArray(dealsRes) ? dealsRes : dealsRes.data ?? []);
      } catch {
        setStages([]);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tabs = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'tabla', label: 'Tabla' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pipeline de Ventas"
        description="Arrastra las oportunidades entre etapas"
      />
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="mt-4">
        {loading ? (
          <Loading />
        ) : activeTab === 'kanban' ? (
          <Card padding={false}>
            <KanbanBoard />
          </Card>
        ) : (
          <Card padding={false}>
            <Table
              columns={[
                {
                  key: 'title',
                  label: 'Título',
                  render: (d: any) => (
                    <Link href={`/deals/${d.id}`} className="text-[var(--primary)] hover:underline font-medium">
                      {d.title}
                    </Link>
                  ),
                },
                {
                  key: 'contact',
                  label: 'Contacto',
                  render: (d: any) => d.contact?.name ?? '—',
                },
                {
                  key: 'value',
                  label: 'Valor',
                  render: (d: any) => fmt(d.value ?? 0),
                },
                {
                  key: 'stage',
                  label: 'Etapa',
                  render: (d: any) => {
                    const s = stageMap[d.stage] ?? { label: d.stage, variant: 'default' as const };
                    return <Badge variant={s.variant}>{s.label}</Badge>;
                  },
                },
                {
                  key: 'expectedCloseDate',
                  label: 'Cierre Esperado',
                  render: (d: any) =>
                    d.expectedCloseDate
                      ? new Date(d.expectedCloseDate).toLocaleDateString('es-MX')
                      : '—',
                },
              ]}
              data={deals}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
