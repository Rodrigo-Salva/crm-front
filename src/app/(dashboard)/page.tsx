'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Loading } from '@/modules/shared';
import { useAuth } from '@/modules/shared/hooks/useAuth';
import { api } from '@/modules/shared/services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [salesGoals, setSalesGoals] = useState<any[]>([]);
  const [mrrArr, setMrrArr] = useState<{ mrr: Record<string, number>; arr: Record<string, number>; activeSubscriptions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, pipelineRes, forecastRes, dealsRes, activityRes, goalsRes, mrrRes] = await Promise.all([
        api.get<any>('/dashboard/summary'),
        api.get<any>('/dashboard/pipeline'),
        api.get<any>('/dashboard/forecast?months=3'),
        api.get<any>('/dashboard/deals-by-stage'),
        api.get<any>('/dashboard/monthly-activity?months=6'),
        api.get<any>('/sales-goals'),
        api.get<any>('/dashboard/mrr'),
      ]);
      setSummary(summaryRes);
      setPipeline(Array.isArray(pipelineRes) ? pipelineRes : []);
      setForecast(Array.isArray(forecastRes) ? forecastRes : []);
      setDealsByStage(Array.isArray(dealsRes) ? dealsRes : []);
      setMonthlyActivity(Array.isArray(activityRes) ? activityRes : []);
      setSalesGoals(Array.isArray(goalsRes) ? goalsRes : []);
      setMrrArr(mrrRes ?? null);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  if (loading) return <Loading />;

  const kpis = [
    { label: 'Leads', value: summary?.totalDeals ?? 0, symbol: 'NEG', trend: '+5.1%' },
    { label: 'Empresas', value: summary?.totalCompanies ?? 0, symbol: 'EMP', trend: '+1.2%' },
    { label: 'Cerrados', value: summary?.closedDealsValue ? `$${(summary.closedDealsValue / 1000).toFixed(1)}k` : '0', symbol: 'WIN', trend: '+8.4%' },
  ];

  const mrrCurrency = mrrArr ? Object.keys(mrrArr.mrr)[0] : undefined;
  const mrrValue = mrrCurrency ? mrrArr!.mrr[mrrCurrency] : 0;
  const arrValue = mrrCurrency ? mrrArr!.arr[mrrCurrency] : 0;
  const formatMrr = (v: number) =>
    mrrCurrency ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: mrrCurrency }).format(v) : formatCurrency(v);

  const myGoal = salesGoals.find(g => g.userId === user?.id);
  const goalProgress = myGoal?.progressPercent ?? 0;
  const isGoalReached = goalProgress >= 100;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenido, Usuario</h1>
          <p className="text-[var(--text-secondary)] mt-1">Aquí tienes el resumen de tu CRM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 p-6 flex flex-col justify-between bg-gradient-to-br from-[var(--secondary)] to-[var(--card-bg)]">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[var(--text-secondary)] font-medium">Valor Total Cerrado</span>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--sidebar-hover)] text-white text-xs border border-[var(--border)]">6M</span>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight mb-2">
              {formatCurrency(summary?.closedDealsValue ?? 0)}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Retorno</span>
              <span className="text-[var(--success)] flex items-center font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                +3.5%
              </span>
            </div>
          </div>
        </Card>

        <Card className="col-span-2 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[var(--text-secondary)] font-medium">KPIs Principales</span>
            <button className="text-sm px-4 py-1.5 rounded-full border border-[var(--border)] text-white hover:bg-[var(--sidebar-hover)] transition-colors">
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-[var(--secondary)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 rounded-xl p-4 border border-[var(--border)] hover:border-white/10 flex flex-col hover:-translate-y-[1px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <span className="text-white font-semibold text-lg mb-1">{kpi.value}</span>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                      {kpi.symbol}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{kpi.label}</span>
                  </div>
                  <span className="text-xs text-[var(--success)]">{kpi.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {mrrArr && mrrCurrency && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white font-semibold text-lg">Ingresos Recurrentes</span>
            <span className="text-xs text-[var(--text-secondary)]">{mrrArr.activeSubscriptions} suscripciones activas</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--secondary)] rounded-xl p-4 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">MRR (mensual)</p>
              <p className="text-2xl font-bold text-white">{formatMrr(mrrValue)}</p>
            </div>
            <div className="bg-[var(--secondary)] rounded-xl p-4 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">ARR (anual)</p>
              <p className="text-2xl font-bold text-white">{formatMrr(arrValue)}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white font-semibold text-lg">Actividad Mensual</span>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '6M', '1Y'].map((t) => (
                <button key={t} className={`w-8 h-8 rounded-full text-xs font-medium border border-[var(--border)] transition-colors ${t === '6M' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--sidebar-hover)]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {monthlyActivity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivity} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="col-span-1 p-6 flex flex-col relative overflow-hidden bg-gradient-to-b from-[var(--card-bg)] to-[var(--secondary)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 21v-5h4.94c1.23 0 1.94-1.39 1.23-2.4l-7.5-10.5C11.53 2.18 10.5 2.62 10.5 3.5v5H5.56c-1.23 0-1.94 1.39-1.23 2.4l7.5 10.5c.64.92 1.67.48 1.67-.4z"/>
            </svg>
          </div>
          
          <div className="flex justify-between items-center mb-6 z-10">
            <span className="text-white font-semibold text-lg">Tu Meta Mensual</span>
            {isGoalReached && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                ¡Alcanzada!
              </span>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center z-10">
            {myGoal && myGoal.targetValue > 0 ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">Progreso de Ventas</span>
                    <span className="font-semibold text-white">{goalProgress}%</span>
                  </div>
                  <div className="w-full bg-[var(--sidebar-border)] rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isGoalReached ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-[var(--celeste-600)] to-[var(--celeste-400)]'}`} 
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Logrado</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(myGoal.actualValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Objetivo</p>
                    <p className="text-lg font-bold text-[var(--text-muted)]">{formatCurrency(myGoal.targetValue)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Aún no tienes una meta asignada este mes.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white font-semibold text-lg">Progreso de Pipeline</span>
            <div className="flex bg-[var(--secondary)] rounded-full p-1 border border-[var(--border)]">
              <button className="px-4 py-1 text-xs rounded-full bg-[var(--primary)] text-white">Todos</button>
              <button className="px-4 py-1 text-xs rounded-full text-[var(--text-secondary)] hover:text-white">Ganados</button>
              <button className="px-4 py-1 text-xs rounded-full text-[var(--text-secondary)] hover:text-white">Perdidos</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-secondary)] uppercase">
                <tr>
                  <th className="py-3 font-medium">Etapa</th>
                  <th className="py-3 font-medium">Porcentaje</th>
                  <th className="py-3 font-medium">Cantidad</th>
                  <th className="py-3 font-medium text-right">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">Sin datos</td></tr>
                ) : (
                  pipeline.map((s: any, idx) => (
                    <tr key={idx} className="border-t border-[var(--border)] text-white">
                      <td className="py-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || 'var(--primary)' }}></div>
                        {s.name}
                      </td>
                      <td className="py-4 text-[var(--text-secondary)]">{s.percentage}%</td>
                      <td className="py-4">{s.count}</td>
                      <td className="py-4 text-right text-[var(--success)]">+2.4%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="col-span-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white font-semibold text-lg">Negocios por Etapa</span>
            <button className="text-[var(--text-secondary)] hover:text-white">...</button>
          </div>
          <div className="space-y-4">
            {dealsByStage.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm py-4 text-center">Sin datos</p>
            ) : (
              dealsByStage.map((s: any, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center text-xs text-white border border-[var(--border)]">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{s.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{s.count} Negocios</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--success)] font-medium">{(s.count * 1.5).toFixed(1)}k</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
