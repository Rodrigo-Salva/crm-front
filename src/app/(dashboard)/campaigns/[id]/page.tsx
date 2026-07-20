'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Badge, Card } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Campaign } from '@/modules/shared/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sending: { label: 'Enviando', variant: 'warning' },
  sent: { label: 'Enviada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Campaign>(`/campaigns/${id}`);
      setCampaign(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  useEffect(() => {
    if (campaign?.status !== 'sending') return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [campaign?.status, load]);

  if (loading) return <Loading />;
  if (!campaign) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Campaña no encontrada</p>
      <Button className="mt-4" onClick={() => router.push('/campaigns')}>Volver</Button>
    </div>
  );

  const cfg = statusConfig[campaign.status] || { label: campaign.status, variant: 'default' as const };
  const totalRecipients = campaign._count?.recipients ?? campaign.totalRecipients;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/campaigns')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{campaign.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{campaign.subject}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/campaigns/${id}/edit`)}>Editar</Button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <Card>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Destinatarios</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{totalRecipients}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Enviados</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{campaign.sentCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Abiertos</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{campaign.openedCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Clics</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{campaign.clickedCount ?? 0}</p>
        </Card>
      </div>

      {campaign.body && (
        <Card>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Contenido</p>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{campaign.body}</p>
        </Card>
      )}
    </div>
  );
}
