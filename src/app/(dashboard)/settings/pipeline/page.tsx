'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Modal, Input, ConfirmDialog, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface SubPhase {
  id: string;
  name: string;
  order: number;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  isWon?: boolean;
  isLost?: boolean;
  maxLeads?: number | null;
  subPhases?: SubPhase[];
}

const DEFAULT_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b'];

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2196f3');
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [maxLeads, setMaxLeads] = useState('');
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [subPhaseModalStage, setSubPhaseModalStage] = useState<Stage | null>(null);
  const [subPhaseName, setSubPhaseName] = useState('');
  const [editingSubPhase, setEditingSubPhase] = useState<SubPhase | null>(null);
  const [deleteSubPhase, setDeleteSubPhase] = useState<{ stageId: string; id: string } | null>(null);
  const [savingSubPhase, setSavingSubPhase] = useState(false);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Stage[]>('/pipeline-stages');
      setStages(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setColor(DEFAULT_COLORS[stages.length % DEFAULT_COLORS.length]);
    setIsWon(false);
    setIsLost(false);
    setMaxLeads('');
    setShowModal(true);
  };

  const openEdit = (s: Stage) => {
    setEditing(s);
    setName(s.name);
    setColor(s.color || '#2196f3');
    setIsWon(!!s.isWon);
    setIsLost(!!s.isLost);
    setMaxLeads(s.maxLeads ? String(s.maxLeads) : '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = { name, color, isWon, isLost, maxLeads: maxLeads ? Number(maxLeads) : null };
      if (editing) {
        await api.patch(`/pipeline-stages/${editing.id}`, body);
      } else {
        await api.post('/pipeline-stages', body);
      }
      setShowModal(false);
      await fetchStages();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/pipeline-stages/${deleteId}`);
      setDeleteId(null);
      await fetchStages();
    } catch {}
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const prev = stages[index - 1];
    const curr = stages[index];
    await Promise.all([
      api.patch(`/pipeline-stages/${curr.id}`, { order: prev.order }),
      api.patch(`/pipeline-stages/${prev.id}`, { order: curr.order }),
    ]);
    await fetchStages();
  };

  const moveDown = async (index: number) => {
    if (index === stages.length - 1) return;
    const next = stages[index + 1];
    const curr = stages[index];
    await Promise.all([
      api.patch(`/pipeline-stages/${curr.id}`, { order: next.order }),
      api.patch(`/pipeline-stages/${next.id}`, { order: curr.order }),
    ]);
    await fetchStages();
  };

  const openCreateSubPhase = (stage: Stage) => {
    setSubPhaseModalStage(stage);
    setEditingSubPhase(null);
    setSubPhaseName('');
  };

  const openEditSubPhase = (stage: Stage, sp: SubPhase) => {
    setSubPhaseModalStage(stage);
    setEditingSubPhase(sp);
    setSubPhaseName(sp.name);
  };

  const handleSaveSubPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subPhaseModalStage || !subPhaseName.trim()) return;
    setSavingSubPhase(true);
    try {
      if (editingSubPhase) {
        await api.patch(`/pipeline-stages/${subPhaseModalStage.id}/sub-phases/${editingSubPhase.id}`, { name: subPhaseName });
      } else {
        await api.post(`/pipeline-stages/${subPhaseModalStage.id}/sub-phases`, { name: subPhaseName });
      }
      setSubPhaseModalStage(null);
      await fetchStages();
    } catch {} finally { setSavingSubPhase(false); }
  };

  const handleDeleteSubPhase = async () => {
    if (!deleteSubPhase) return;
    try {
      await api.delete(`/pipeline-stages/${deleteSubPhase.stageId}/sub-phases/${deleteSubPhase.id}`);
      setDeleteSubPhase(null);
      await fetchStages();
    } catch {}
  };

  const moveSubPhase = async (stage: Stage, index: number, direction: -1 | 1) => {
    const subPhases = stage.subPhases || [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subPhases.length) return;
    const curr = subPhases[index];
    const target = subPhases[targetIndex];
    await Promise.all([
      api.patch(`/pipeline-stages/${stage.id}/sub-phases/${curr.id}`, { order: target.order }),
      api.patch(`/pipeline-stages/${stage.id}/sub-phases/${target.id}`, { order: curr.order }),
    ]);
    await fetchStages();
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Pipeline de Ventas"
        description="Personaliza las etapas del pipeline de ventas"
        actions={<Button onClick={openCreate}>+ Nueva etapa</Button>}
      />

      <Card padding={false}>
        {stages.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">No hay etapas configuradas</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {stages.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--secondary)]/50 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-gray-300 hover:text-[var(--text)] disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                    <button onClick={() => moveDown(i)} disabled={i === stages.length - 1} className="p-0.5 text-gray-300 hover:text-[var(--text)] disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                  </div>
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: s.color || '#2196f3' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text)] flex items-center gap-2">
                      {s.name}
                      {s.isWon && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-100 text-green-700">Ganada</span>}
                      {s.isLost && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">Perdida</span>}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">Orden: {s.order}{s.maxLeads ? ` · Cupo: ${s.maxLeads} leads` : ''}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedStageId(expandedStageId === s.id ? null : s.id)}>
                    Sub-fases ({s.subPhases?.length ?? 0})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)} className="text-red-500">Eliminar</Button>
                </div>

                {expandedStageId === s.id && (
                  <div className="pl-16 pr-5 pb-4 space-y-2">
                    {(s.subPhases || []).map((sp, spi) => (
                      <div key={sp.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-[var(--bg)]">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveSubPhase(s, spi, -1)} disabled={spi === 0} className="p-0.5 text-gray-300 hover:text-[var(--text)] disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                          <button onClick={() => moveSubPhase(s, spi, 1)} disabled={spi === (s.subPhases?.length ?? 0) - 1} className="p-0.5 text-gray-300 hover:text-[var(--text)] disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                        </div>
                        <span className="flex-1 text-sm text-[var(--text)]">{sp.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => openEditSubPhase(s, sp)}>Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteSubPhase({ stageId: s.id, id: sp.id })} className="text-red-500">Eliminar</Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => openCreateSubPhase(s)}>+ Agregar sub-fase</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar etapa' : 'Nueva etapa'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Prospecto" />
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-[var(--border)]" />
              <div className="flex gap-1.5">
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={isWon} onChange={(e) => setIsWon(e.target.checked)} />
              Es etapa ganada
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={isLost} onChange={(e) => setIsLost(e.target.checked)} />
              Es etapa perdida
            </label>
          </div>
          <Input
            label="Cupo máximo de leads (opcional)"
            type="number"
            min="1"
            value={maxLeads}
            onChange={(e) => setMaxLeads(e.target.value)}
            placeholder="Sin límite"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardandoâ¦' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar etapa" message="Â¿Estás seguro? Los negocios en esta etapa se quedarán sin etapa asignada." />

      <Modal open={!!subPhaseModalStage} onClose={() => setSubPhaseModalStage(null)} title={editingSubPhase ? 'Editar sub-fase' : 'Nueva sub-fase'}>
        <form onSubmit={handleSaveSubPhase} className="space-y-4">
          <Input label="Nombre" value={subPhaseName} onChange={(e) => setSubPhaseName(e.target.value)} required placeholder="Ej: Llamada 1" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSubPhaseModalStage(null)}>Cancelar</Button>
            <Button type="submit" disabled={savingSubPhase}>{savingSubPhase ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteSubPhase} onClose={() => setDeleteSubPhase(null)} onConfirm={handleDeleteSubPhase} title="Eliminar sub-fase" message="¿Estás seguro? Los leads en esta sub-fase la perderán." />
    </div>
  );
}


