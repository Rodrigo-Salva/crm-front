'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

interface Setting {
  key: string;
  value: string;
}

export default function TenantSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Setting[]>('/tenant-settings');
      setSettings(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    const newKey = `setting_${Date.now()}`;
    setSettings((prev) => [...prev, { key: newKey, value: '' }]);
    setCreatedKeys((prev) => new Set(prev).add(newKey));
  };

  const handleRemove = (key: string) => {
    setSettings((prev) => prev.filter((s) => s.key !== key));
    setCreatedKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
  };

  const handleChangeValue = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const obj: Record<string, string> = {};
      settings.forEach((s) => { obj[s.key] = s.value; });
      await api.put('/tenant-settings', obj);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Configuración del tenant"
        description="Variables de configuración del sistema"
        actions={<Button onClick={handleAdd}>Agregar setting</Button>}
      />

      <Card>
        {settings.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-12">No hay configuraciones definidas</p>
        ) : (
          <div className="space-y-3">
            {settings.map((s) => {
              const isNew = createdKeys.has(s.key);
              return (
                <div key={s.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Key"
                      value={s.key}
                      readOnly={!isNew}
                      onChange={(e) => {
                        if (!isNew) return;
                        setSettings((prev) => {
                          const next = [...prev];
                          const idx = next.findIndex((x) => x.key === s.key);
                          if (idx !== -1) {
                            next[idx] = { ...next[idx], key: e.target.value };
                          }
                          return next;
                        });
                        setCreatedKeys((prev) => {
                          const next = new Set(prev);
                          next.delete(s.key);
                          next.add(e.target.value);
                          return next;
                        });
                      }}
                      placeholder="Nombre de la clave"
                    />
                  </div>
                  <div className="flex-[2]">
                    <Input
                      label="Value"
                      value={s.value}
                      onChange={(e) => handleChangeValue(s.key, e.target.value)}
                      placeholder="Valor"
                    />
                  </div>
                  <button
                    onClick={() => handleRemove(s.key)}
                    className="p-2 mb-0.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {settings.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
