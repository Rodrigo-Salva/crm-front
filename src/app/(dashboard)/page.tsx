'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, pipelineRes, forecastRes, dealsRes, activityRes] = await Promise.all([
        api.get<any>('/dashboard/summary'),
        api.get<any>('/dashboard/pipeline'),
        api.get<any>('/dashboard/forecast?months=3'),
        api.get<any>('/dashboard/deals-by-stage'),
        api.get<any>('/dashboard/monthly-activity?months=6'),
      ]);
      setSummary(summaryRes);
      setPipeline(Array.isArray(pipelineRes) ? pipelineRes : []);
      setForecast(Array.isArray(forecastRes) ? forecastRes : []);
      setDealsByStage(Array.isArray(dealsRes) ? dealsRes : []);
      setMonthlyActivity(Array.isArray(activityRes) ? activityRes : []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  if (loading) return <Loading />;

  const kpis = [
    { label: 'Contactos', value: summary?.totalContacts ?? 0, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Negocios', value: summary?.totalDeals ?? 0, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Empresas', value: summary?.totalCompanies ?? 0, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Cerrados', value: formatCurrency(summary?.closedDealsValue ?? 0), icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-[var(--success)]', bg: 'bg-green-50' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Dashboard" description="Resumen general de tu CRM" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${kpi.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={kpi.icon} />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">Actividad mensual</h3>
          {monthlyActivity.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#2196f3" name="Llamadas" stackId="a" />
                  <Bar dataKey="emails" fill="#4caf50" name="Emails" stackId="a" />
                  <Bar dataKey="meetings" fill="#ff9800" name="Reuniones" stackId="a" />
                  <Bar dataKey="others" fill="#9e9e9e" name="Otros" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">Negocios por etapa</h3>
          {dealsByStage.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dealsByStage} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {dealsByStage.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">Forecast (3 meses)</h3>
          {forecast.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm">Sin datos</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: any) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                  <Bar dataKey="total" fill="#2196f3" name="Total" />
                  <Bar dataKey="weighted" fill="#4caf50" name="Ponderado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
