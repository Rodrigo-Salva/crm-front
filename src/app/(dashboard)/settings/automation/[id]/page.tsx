'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Loading, Button } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Automation } from '@/modules/automation/constants';
import { AutomationCanvas } from '@/modules/automation/components/automation-canvas';

export default function AutomationCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Automation>(`/automations/${id}`);
      setAutomation(res);
    } catch {
      router.push('/settings/automation');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load() }, [load]);

  if (loading) return <Loading />;
  if (!automation) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/settings/automation"
        backLabel="Volver a Automatización"
        title={automation.name}
        description="Arrastra bloques desde la izquierda y conéctalos para armar el flujo"
        actions={<Button variant="secondary" onClick={load}>Recargar</Button>}
      />
      <AutomationCanvas key={automation.id} automation={automation} />
    </div>
  );
}
