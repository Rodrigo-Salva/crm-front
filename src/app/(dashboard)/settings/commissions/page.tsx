'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface RateUser {
  id: string;
  name: string;
  commissionRate: number | null;
}

interface CommissionEntry {
  id: string;
  amount: number;
  baseAmount: number;
  rate: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string };
  quote: { id: string; number: string; grandTotal: number };
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CommissionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [defaultRate, setDefaultRate] = useState(0);
  const [users, setUsers] = useState<RateUser[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await api.get<{ defaultRate: number; users: RateUser[] }>('/commissions/rates');
      setDefaultRate(res?.defaultRate ?? 0);
      setUsers(Array.isArray(res?.users) ? res.users : []);
    } catch {} finally { setRatesLoading(false); }
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const res = await api.get<CommissionEntry[]>(`/commissions?year=${year}&month=${month}`);
      setEntries(Array.isArray(res) ? res : []);
    } catch {} finally { setLedgerLoading(false); }
  }, [year, month]);

  useEffect(() => { loadRates(); }, [loadRates]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const handleSaveDefaultRate = async () => {
    setSavingRate('default');
    try {
      await api.patch('/commissions/rates/default', { rate: defaultRate });
      loadRates();
    } catch {} finally { setSavingRate(null); }
  };

  const handleSaveUserRate = async (userId: string) => {
    const raw = editingRate[userId];
    const rate = raw === '' || raw === undefined ? null : Number(raw);
    setSavingRate(userId);
    try {
      await api.patch(`/commissions/rates/${userId}`, { rate });
      setEditingRate((prev) => { const next = { ...prev }; delete next[userId]; return next; });
      loadRates();
    } catch {} finally { setSavingRate(null); }
  };

  const handleMarkPaid = async (id: string) => {
    setPaying(id);
    try {
      await api.patch(`/commissions/${id}/pay`, {});
      loadLedger();
    } catch {} finally { setPaying(null); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Comisiones de venta"
        description="Configura las tasas de comisión y revisa el histórico de comisiones generadas por vendedor"
      />

      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Tasas de comisión</h3>
        {ratesLoading ? <Loading /> : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Tasa por defecto del tenant</p>
                <p className="text-xs text-[var(--text-secondary)]">Se aplica a vendedores sin una tasa individual configurada</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-[var(--text-secondary)]">%</span>
                <Button size="sm" loading={savingRate === 'default'} onClick={handleSaveDefaultRate}>Guardar</Button>
              </div>
            </div>

            {users.map((u) => {
              const isEditing = editingRate[u.id] !== undefined;
              return (
                <div key={u.id} className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{u.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {u.commissionRate != null ? `${u.commissionRate}% (override)` : `Usa el default (${defaultRate}%)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Default"
                          value={editingRate[u.id]}
                          onChange={(e) => setEditingRate((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          className="w-24"
                        />
                        <Button size="sm" loading={savingRate === u.id} onClick={() => handleSaveUserRate(u.id)}>Guardar</Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingRate((prev) => ({ ...prev, [u.id]: u.commissionRate != null ? String(u.commissionRate) : '' }))}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {ledgerLoading ? <Loading /> : (
        <div className="space-y-3">
          {entries.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No hay comisiones generadas en este periodo.</p>
          )}
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{entry.user.name} · Quote {entry.quote.number}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {formatCurrency(entry.baseAmount)} × {entry.rate}% = {formatCurrency(entry.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${entry.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {entry.status === 'paid' ? 'Pagada' : 'Pendiente'}
                  </span>
                  {entry.status === 'pending' && (
                    <Button size="sm" loading={paying === entry.id} onClick={() => handleMarkPaid(entry.id)}>Marcar pagada</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
