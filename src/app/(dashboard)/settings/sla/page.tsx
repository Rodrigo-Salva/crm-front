'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const PRIORITIES: { key: string; label: string }[] = [
  { key: 'low', label: 'Baja' },
  { key: 'medium', label: 'Media' },
  { key: 'high', label: 'Alta' },
  { key: 'critical', label: 'Crítica' },
];

type Policy = Record<string, { responseHours: number; resolutionHours: number }>;

export default function SlaSettingsPage() {
  const [policy, setPolicy] = useState<Policy>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Policy>('/tickets/sla-policy');
      setPolicy(data || {});
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateField = (priority: string, field: 'responseHours' | 'resolutionHours', value: string) => {
    const num = Number(value) || 0;
    setPolicy((prev) => ({ ...prev, [priority]: { ...prev[priority], [field]: num } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/tickets/sla-policy', policy);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="SLA de tickets"
        description="Define en cuántas horas se debe responder y resolver cada ticket, según su prioridad"
      />

      <Card>
        <div className="space-y-6">
          {PRIORITIES.map((p) => (
            <div key={p.key} className="grid grid-cols-1 sm:grid-cols-3 items-end gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-[var(--text)]">{p.label}</p>
              <Input
                label="Responder en (horas)"
                type="number"
                min="0"
                value={String(policy[p.key]?.responseHours ?? '')}
                onChange={(e) => updateField(p.key, 'responseHours', e.target.value)}
              />
              <Input
                label="Resolver en (horas)"
                type="number"
                min="0"
                value={String(policy[p.key]?.resolutionHours ?? '')}
                onChange={(e) => updateField(p.key, 'resolutionHours', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
          <Button onClick={handleSave} loading={saving}>Guardar</Button>
        </div>
      </Card>
    </div>
  );
}
