const healthConfig: Record<string, { label: string; className: string }> = {
  healthy: { label: 'Saludable', className: 'bg-emerald-50 text-emerald-700' },
  at_risk: { label: 'En riesgo', className: 'bg-amber-50 text-amber-700' },
  critical: { label: 'Crítico', className: 'bg-red-50 text-red-700' },
  unknown: { label: 'Sin datos', className: 'bg-gray-100 text-gray-500' },
};

interface HealthBadgeProps {
  status?: 'healthy' | 'at_risk' | 'critical' | 'unknown';
  score?: number | null;
}

export function HealthBadge({ status, score }: HealthBadgeProps) {
  const cfg = healthConfig[status || 'unknown'];
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
      {score != null && <span className="opacity-70">· {score}</span>}
    </div>
  );
}
