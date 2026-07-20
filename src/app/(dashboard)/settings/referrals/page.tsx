'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

interface ReferralReward {
  id: string;
  amount: number;
  baseAmount: number;
  rate: number;
  status: string;
  createdAt: string;
  referrerLead: { id: string; name: string };
  referredLead: { id: string; name: string };
  quote: { id: string; number: string; grandTotal: number };
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function ReferralsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [rate, setRate] = useState(0);
  const [rateLoading, setRateLoading] = useState(true);
  const [savingRate, setSavingRate] = useState(false);

  const [entries, setEntries] = useState<ReferralReward[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const loadRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await api.get<{ rate: number }>('/referrals/rate');
      setRate(res?.rate ?? 0);
    } catch {} finally { setRateLoading(false); }
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const res = await api.get<ReferralReward[]>(`/referrals?year=${year}&month=${month}`);
      setEntries(Array.isArray(res) ? res : []);
    } catch {} finally { setLedgerLoading(false); }
  }, [year, month]);

  useEffect(() => { loadRate(); }, [loadRate]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const handleSaveRate = async () => {
    setSavingRate(true);
    try {
      await api.patch('/referrals/rate', { rate });
      loadRate();
    } catch {} finally { setSavingRate(false); }
  };

  const handleMarkPaid = async (id: string) => {
    setPaying(id);
    try {
      await api.patch(`/referrals/${id}/pay`, {});
      loadLedger();
    } catch {} finally { setPaying(null); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings"
        backLabel="Volver a Configuración"
        title="Referidos"
        description="Configura la recompensa por referidos y revisa el histórico de recompensas generadas"
      />

      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Tasa de recompensa</h3>
        {rateLoading ? <Loading /> : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">% sobre el monto del quote convertido</p>
              <p className="text-xs text-[var(--text-secondary)]">Se paga al lead que refirió al cliente que compró</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-[var(--text-secondary)]">%</span>
              <Button size="sm" loading={savingRate} onClick={handleSaveRate}>Guardar</Button>
            </div>
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
            <p className="text-sm text-[var(--text-secondary)]">No hay recompensas generadas en este periodo.</p>
          )}
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {entry.referrerLead.name} refirió a {entry.referredLead.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Quote {entry.quote.number} · {formatCurrency(entry.baseAmount)} × {entry.rate}% = {formatCurrency(entry.amount)}
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
