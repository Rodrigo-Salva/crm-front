'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, Card, Loading, Badge, EmptyState } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface DuplicateLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  companyName?: string;
  status: string;
  value: number;
  createdAt: string;
  owner?: { id: string; name: string };
}

interface DuplicateGroup {
  matchedBy: 'email' | 'phone';
  leads: DuplicateLead[];
}

export default function LeadDuplicatesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, { primaryId: string; ids: Set<string> }>>({});
  const [merging, setMerging] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DuplicateGroup[]>('/leads/duplicates');
      setGroups(Array.isArray(res) ? res : []);
      const initial: Record<number, { primaryId: string; ids: Set<string> }> = {};
      (Array.isArray(res) ? res : []).forEach((g, i) => {
        initial[i] = { primaryId: g.leads[0].id, ids: new Set(g.leads.map((l) => l.id)) };
      });
      setSelected(initial);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleInclude = (groupIndex: number, leadId: string) => {
    setSelected((prev) => {
      const current = prev[groupIndex];
      const ids = new Set(current.ids);
      if (ids.has(leadId)) ids.delete(leadId); else ids.add(leadId);
      return { ...prev, [groupIndex]: { ...current, ids } };
    });
  };

  const setPrimary = (groupIndex: number, leadId: string) => {
    setSelected((prev) => ({ ...prev, [groupIndex]: { ...prev[groupIndex], primaryId: leadId } }));
  };

  const handleMerge = async (groupIndex: number) => {
    const sel = selected[groupIndex];
    if (!sel) return;
    const duplicateIds = Array.from(sel.ids).filter((id) => id !== sel.primaryId);
    if (duplicateIds.length === 0) return;
    setMerging(groupIndex);
    try {
      await api.post('/leads/merge', { primaryId: sel.primaryId, duplicateIds });
      load();
    } catch {} finally { setMerging(null); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Leads duplicados"
        description="Detectados por email o teléfono coincidente. Elige el lead principal y fusiona el resto."
      />

      {groups.length === 0 ? (
        <EmptyState title="Sin duplicados" description="No se encontraron leads con el mismo email o teléfono." />
      ) : (
        <div className="space-y-4">
          {groups.map((group, i) => {
            const sel = selected[i];
            if (!sel) return null;
            return (
              <Card key={i}>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={group.matchedBy === 'email' ? 'primary' : 'warning'}>
                    Coincide por {group.matchedBy === 'email' ? 'email' : 'teléfono'}
                  </Badge>
                  <Button
                    size="sm"
                    loading={merging === i}
                    disabled={sel.ids.size < 2}
                    onClick={() => handleMerge(i)}
                  >
                    Fusionar {sel.ids.size} en 1
                  </Button>
                </div>
                <div className="space-y-2">
                  {group.leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${sel.ids.has(lead.id) ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={sel.ids.has(lead.id)}
                        onChange={() => toggleInclude(i, lead.id)}
                      />
                      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name={`primary-${i}`}
                          checked={sel.primaryId === lead.id}
                          disabled={!sel.ids.has(lead.id)}
                          onChange={() => setPrimary(i, lead.id)}
                        />
                        Principal
                      </label>
                      <button onClick={() => router.push(`/leads/${lead.id}`)} className="flex-1 text-left hover:text-[var(--primary)] transition-colors">
                        <span className="font-medium text-sm">{lead.name}</span>
                        <span className="text-xs text-[var(--text-secondary)] ml-2">{lead.email || lead.phone || '—'}</span>
                      </button>
                      <span className="text-xs text-[var(--text-secondary)]">{lead.company || lead.companyName || '—'}</span>
                      <Badge variant="default">{lead.status}</Badge>
                      {lead.value > 0 && <span className="text-sm font-semibold">{formatCurrency(lead.value)}</span>}
                      <span className="text-xs text-[var(--text-muted)]">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
