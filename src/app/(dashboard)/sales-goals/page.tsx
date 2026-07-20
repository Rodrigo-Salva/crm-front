'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Table, Loading, Button, Modal, Input } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';
import { useAuth } from '@/modules/shared/hooks/useAuth';

interface SalesGoal {
  id: string;
  userId: string;
  year: number;
  month: number;
  targetValue: number;
  targetDeals?: number;
  user?: { id: string; name: string; email: string };
  // Estos campos virtuales vendrán del backend si los calcula
  currentValue?: number;
  currentDeals?: number;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function SalesGoalsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SalesGoal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    userId: user?.id || '', 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(),
    targetValue: 0
  });

  // Asumimos que podemos obtener usuarios para asignarles metas
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, usersRes] = await Promise.all([
        api.get<any>('/sales-goals'),
        api.get<any>('/users').catch(() => []) // Si falla, array vacio
      ]);
      setData(Array.isArray(goalsRes) ? goalsRes : []);
      
      if (Array.isArray(usersRes) && usersRes.length > 0) {
         setUsers(usersRes);
         if (!form.userId) setForm(prev => ({...prev, userId: usersRes[0].id}));
      } else if (user) {
         setUsers([{ id: user.id, name: user.name || 'Yo' }]);
         if (!form.userId) setForm(prev => ({...prev, userId: user.id}));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sales-goals', {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        targetValue: Number(form.targetValue)
      });
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'user', label: 'Vendedor', render: (g: SalesGoal) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-medium">
          {g.user?.name ? g.user.name.substring(0, 2).toUpperCase() : 'V'}
        </div>
        <div>
          <div className="font-medium text-[var(--text)]">{g.user?.name || 'Desconocido'}</div>
          <div className="text-xs text-[var(--text-secondary)]">{g.user?.email}</div>
        </div>
      </div>
    )},
    { key: 'period', label: 'Periodo', render: (g: SalesGoal) => (
      <span className="text-[var(--text)] font-medium">{MONTHS[g.month - 1]} {g.year}</span>
    )},
    { key: 'target', label: 'Meta', render: (g: SalesGoal) => (
      <span className="font-semibold text-[var(--text)]">{formatCurrency(g.targetValue)}</span>
    )},
    { key: 'progress', label: 'Progreso (Simulado)', render: (g: SalesGoal) => {
        // Como el backend tal vez aún no envíe el currentValue, lo simulamos para mostrar el componente
        const current = g.currentValue ?? (g.targetValue * 0.4); 
        const progress = g.targetValue > 0 ? Math.min(Math.round((current / g.targetValue) * 100), 100) : 0;
        const color = progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-[var(--primary)]' : 'bg-orange-500';
        
        return (
          <div className="flex flex-col gap-1 w-full max-w-[200px]">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>{formatCurrency(current)}</span>
              <span className="font-medium text-[var(--text)]">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
    }}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Metas de Ventas" 
        description="Establece cuotas y monitorea el rendimiento de tu equipo comercial." 
        actions={<Button onClick={() => setModalOpen(true)}>+ Asignar Meta</Button>}
      />

      <Card padding={false}>
        {loading ? <Loading /> : <Table columns={columns} data={data} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Asignar Nueva Meta">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium mb-1">Vendedor</label>
            <select 
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
              value={form.userId} 
              onChange={e => setForm({...form, userId: e.target.value})}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mes</label>
              <select 
                className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-[var(--primary)]"
                value={form.month} 
                onChange={e => setForm({...form, month: Number(e.target.value)})}
              >
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <Input 
              label="Año" 
              type="number"
              value={form.year} 
              onChange={e => setForm({...form, year: Number(e.target.value)})} 
              required 
            />
          </div>

          <Input 
            label="Monto de Venta (Meta)" 
            type="number"
            min={0}
            step={0.01}
            value={form.targetValue || ''} 
            onChange={e => setForm({...form, targetValue: Number(e.target.value)})} 
            required 
            placeholder="Ej. 50000"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Asignar Meta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
