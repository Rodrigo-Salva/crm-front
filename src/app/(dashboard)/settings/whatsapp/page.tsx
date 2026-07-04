'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const TEMPLATE_OPTIONS = [
  { value: 'welcome', label: 'Bienvenida' },
  { value: 'reminder', label: 'Recordatorio' },
  { value: 'confirmation', label: 'Confirmación' },
];

export default function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [testMessage, setTestMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessId: '',
  });

  const [test, setTest] = useState({ to: '', templateName: 'welcome' });

  useEffect(() => {
    api.get('/whatsapp/config').then((res: any) => {
      if (res) {
        setConfigured(true);
        setForm({
          phoneNumberId: res.phoneNumberId || '',
          accessToken: '',
          businessId: res.businessId || '',
        });
      }
    }).catch((err: any) => {
      if (err.message?.includes('404')) {
        setConfigured(false);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: any = { ...form };
      if (!body.accessToken) delete body.accessToken;
      await api.put('/whatsapp/config', body);
      setMessage({ text: 'Configuración guardada correctamente', type: 'success' });
      setConfigured(true);
    } catch {
      setMessage({ text: 'Error al guardar la configuración', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTestMessage(null);
    try {
      await api.post('/whatsapp/send', { to: test.to, templateName: test.templateName });
      setTestMessage({ text: 'Mensaje de prueba enviado correctamente', type: 'success' });
    } catch {
      setTestMessage({ text: 'Error al enviar mensaje de prueba', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="WhatsApp"
        description={configured ? 'Configuración activa' : 'No configurado'}
      />

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Configuración de WhatsApp</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Phone Number ID"
            value={form.phoneNumberId}
            onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
            placeholder="ID del número de teléfono"
            required
          />
          <Input
            label="Access Token"
            type="password"
            value={form.accessToken}
            onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
            placeholder={configured ? 'â¢â¢â¢â¢â¢â¢â¢â¢' : 'Token de acceso permanente'}
          />
          <Input
            label="Business ID"
            value={form.businessId}
            onChange={(e) => setForm({ ...form, businessId: e.target.value })}
            placeholder="ID de la cuenta de negocio"
            required
          />
          <Button type="submit" loading={saving}>Guardar configuración</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Enviar mensaje de prueba</h2>
        {testMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${
            testMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {testMessage.text}
          </div>
        )}
        <form onSubmit={handleSendTest} className="space-y-4">
          <Input
            label="Teléfono destino"
            value={test.to}
            onChange={(e) => setTest({ ...test, to: e.target.value })}
            placeholder="+521234567890"
            required
          />
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Plantilla
            </label>
            <select
              id="templateName"
              value={test.templateName}
              onChange={(e) => setTest({ ...test, templateName: e.target.value })}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] hover:border-[var(--celeste-400)]"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={sending}>Enviar mensaje de prueba</Button>
        </form>
      </Card>
    </div>
  );
}


