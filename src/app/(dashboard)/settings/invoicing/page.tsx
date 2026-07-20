'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

export default function InvoicingPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    ruc: '',
    token: '',
    serieFactura: 'F001',
    serieBoleta: 'B001',
    sandbox: true,
  });

  useEffect(() => {
    api.get('/invoicing/config').then((res: any) => {
      if (res) {
        setConfigured(true);
        setForm({
          ruc: res.ruc || '',
          token: '',
          serieFactura: res.serieFactura || 'F001',
          serieBoleta: res.serieBoleta || 'B001',
          sandbox: res.sandbox ?? true,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: any = { ...form };
      if (!body.token) delete body.token;
      await api.patch('/invoicing/config', body);
      setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
      setConfigured(true);
    } catch {
      setMessage({ text: 'Error al guardar la configuración', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Facturación electrónica"
        description={configured ? 'Nubefact configurado' : 'No configurado'}
      />

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Configuración de Nubefact</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="RUC del emisor"
            value={form.ruc}
            onChange={(e) => setForm({ ...form, ruc: e.target.value })}
            placeholder="20123456789"
            required
          />
          <Input
            label="Token de Nubefact"
            type="password"
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            placeholder={configured ? '••••••••' : 'Token de la API de Nubefact'}
          />
          <Input
            label="Serie de factura"
            value={form.serieFactura}
            onChange={(e) => setForm({ ...form, serieFactura: e.target.value })}
            placeholder="F001"
          />
          <Input
            label="Serie de boleta"
            value={form.serieBoleta}
            onChange={(e) => setForm({ ...form, serieBoleta: e.target.value })}
            placeholder="B001"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={form.sandbox}
              onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
            />
            Ambiente de pruebas (sandbox)
          </label>
          <Button type="submit" loading={saving}>Guardar configuración</Button>
        </form>
      </Card>
    </div>
  );
}
