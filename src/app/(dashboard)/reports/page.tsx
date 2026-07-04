'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Loading, DatePicker } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, Legend, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#0070F3', '#7928CA', '#FF0080', '#00DFD8', '#F5A623', '#10B981', '#3291FF', '#E2E8F0'];

const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

export default function ReportsPage() {
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState<any>(null);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [activityBySeller, setActivityBySeller] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, dealsRes, activityRes, pipelineRes] = await Promise.all([
        api.get<any>('/dashboard/summary'),
        api.get<any>('/dashboard/deals-by-stage'),
        api.get<any>(`/dashboard/activity-by-seller?from=${from}&to=${to}`),
        api.get<any>('/dashboard/pipeline'),
      ]);
      setSummary(summaryRes);
      setDealsByStage(Array.isArray(dealsRes) ? dealsRes : []);
      setActivityBySeller(Array.isArray(activityRes) ? activityRes : []);
      setPipeline(Array.isArray(pipelineRes) ? pipelineRes : []);
    } catch { } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const handleExport = (format: 'excel' | 'pdf') => {
    const params = new URLSearchParams({ from, to });
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // We append the tenant token to the URL so the backend can authorize the export request
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    params.append('token', token || '');
    
    window.open(`${apiUrl}/dashboard/export/${format}?${params}`, '_blank');
  };

  if (loading) return <Loading />;

  const kpis = [
    { label: 'Total Leads', value: summary?.totalDeals ?? 0 },
    { label: 'Total Empresas', value: summary?.totalCompanies ?? 0 },
    { label: 'Total Actividades', value: summary?.totalActivities ?? 0 },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reportes" description="Exporta y analiza datos de tu CRM" />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Desde</label>
            <DatePicker
              value={from}
              onChange={(val) => setFrom(val)}
              className="w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Hasta</label>
            <DatePicker
              value={to}
              onChange={(val) => setTo(val)}
              className="w-48"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => handleExport('excel')}>
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              Exportar PDF
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-[var(--text-secondary)]">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">Negocios por Etapa</h3>
          {dealsByStage.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dealsByStage} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} stroke="none" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {dealsByStage.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">Actividad por Vendedor</h3>
          {activityBySeller.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityBySeller} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" fill="url(#colorBar)" name="Actividades" radius={[4, 4, 0, 0]}>
                    {activityBySeller.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-semibold text-[var(--text)] mb-4">Pipeline Stages</h3>
        {pipeline.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm">Sin datos</p>
        ) : (
          <div className="space-y-4">
            {pipeline.map((s: any) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--text)]">{s.name}</span>
                  <span className="text-[var(--text-secondary)]">{s.count} ({s.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.percentage}%`, backgroundColor: s.color || 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
