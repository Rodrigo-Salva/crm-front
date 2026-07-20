'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/modules/shared/services/api';
import { Button } from './button';
import { Input } from './input';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
}

interface SavedViewsBarProps {
  entity: string;
  currentFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}

export function SavedViewsBar({ entity, currentFilters, onApply }: SavedViewsBarProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<SavedView[]>(`/saved-views?entity=${entity}`);
      setViews(Array.isArray(res) ? res : []);
    } catch {}
  }, [entity]);

  useEffect(() => { load(); }, [load]);

  const handleApply = (id: string) => {
    setSelected(id);
    const view = views.find((v) => v.id === id);
    if (view) onApply(view.filters as Record<string, string>);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await api.post('/saved-views', { entity, name: nameInput.trim(), filters: currentFilters });
      setNameInput('');
      setShowSaveForm(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/saved-views/${id}`);
      if (selected === id) setSelected('');
      load();
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {views.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            value={selected}
            onChange={(e) => handleApply(e.target.value)}
            className="h-9 px-2 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--text)]"
          >
            <option value="">Vistas guardadas...</option>
            {views.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {selected && (
            <button
              type="button"
              onClick={() => handleDelete(selected)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10"
              title="Eliminar vista"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {showSaveForm ? (
        <div className="flex items-center gap-1">
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nombre de la vista"
            className="w-40 h-9"
          />
          <Button size="sm" loading={saving} onClick={handleSave}>Guardar</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowSaveForm(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setShowSaveForm(true)}>Guardar vista actual</Button>
      )}
    </div>
  );
}
