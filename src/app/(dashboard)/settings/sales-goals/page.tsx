'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface GoalRow {
  userId: string;
  userName: string;
  goalId: string | null;
  targetValue: number;
  targetDeals: number | null;
  actualValue: number;
  actualDeals: number;
  progressPercent: number | null;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function SalesGoalsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<GoalRow[]>(`/sales-goals?year=${year}&month=${month}`);
      setRows(Array.isArray(res) ? res : []);
    } catch {} finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (userId: string) => {
    const value = Number(editing[userId]);
    if (!value || value <= 0) return;
    setSaving(userId);
    try {
      await api.post('/sales-goals', { userId, year, month, targetValue: value });
      setEditing((prev) => { const next = { ...prev }; delete next[userId]; return next; });
      load();
    } catch {} finally { setSaving(null); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Metas de venta"
        description="Define una meta mensual por vendedor y mira el avance contra lo realmente cerrado"
      />

      <div className="flex items-center gap-2 mb-4">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const pct = row.progressPercent;
          const isEditing = editing[row.userId] !== undefined;
          return (
            <Card key={row.userId}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{row.userName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {formatCurrency(row.actualValue)} de {row.targetValue > 0 ? formatCurrency(row.targetValue) : 'sin meta'}
                    {' · '}{row.actualDeals} negocio(s) cerrado(s)
                  </p>
                  {row.targetValue > 0 && (
                    <div className="mt-2 h-2 w-full rounded-full bg-[var(--bg)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct !== null && pct >= 100 ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min="0"
                        value={editing[row.userId]}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [row.userId]: e.target.value }))}
                        className="w-32"
                      />
                      <Button size="sm" loading={saving === row.userId} onClick={() => handleSave(row.userId)}>Guardar</Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing((prev) => ({ ...prev, [row.userId]: String(row.targetValue || '') }))}
                    >
                      {row.targetValue > 0 ? 'Editar meta' : 'Definir meta'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
