'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';
import type { MarketingCampaign } from '@/modules/shared/types';

interface CampaignDetail extends MarketingCampaign {
  leads: { id: string; name: string; status: string; value: number; currency: string }[];
}

interface CampaignStats {
  leadsCount: number;
  wonCount: number;
  totalValueWon: number;
  budget: number;
  roi: number | null;
}

export default function MarketingCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([
          api.get<CampaignDetail>(`/marketing-campaigns/${id}`),
          api.get<CampaignStats>(`/marketing-campaigns/${id}/stats`),
        ]);
        setCampaign(c);
        setStats(s);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!campaign) return <p className="text-sm text-[var(--text-secondary)]">Campaña no encontrada</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings/marketing-campaigns" backLabel="Volver a Campañas"
        title={campaign.name}
        description={campaign.channel || 'Sin canal asignado'}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><p className="text-xs text-[var(--text-secondary)]">Leads vinculados</p><p className="text-xl font-bold text-[var(--text)]">{stats.leadsCount}</p></Card>
          <Card><p className="text-xs text-[var(--text-secondary)]">Leads ganados</p><p className="text-xl font-bold text-[var(--text)]">{stats.wonCount}</p></Card>
          <Card><p className="text-xs text-[var(--text-secondary)]">Valor ganado</p><p className="text-xl font-bold text-[var(--text)]">{formatCurrency(stats.totalValueWon)}</p></Card>
          <Card>
            <p className="text-xs text-[var(--text-secondary)]">ROI</p>
            <p className={`text-xl font-bold ${stats.roi != null && stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.roi != null ? `${stats.roi.toFixed(1)}%` : '—'}
            </p>
          </Card>
        </div>
      )}

      <Card padding={false}>
        {campaign.leads.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">Sin leads vinculados todavía</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {campaign.leads.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--secondary)]/50 transition-colors">
                <span className="text-sm text-[var(--text)]">{l.name}</span>
                <span className="text-xs text-[var(--text-secondary)]">{l.status} · {formatCurrency(l.value, l.currency as any)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
