'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingImap, setSavingImap] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [smtp, setSmtp] = useState({ host: '', port: 587, username: '', password: '', fromEmail: '', fromName: '' });
  const [imap, setImap] = useState({ host: '', port: 993, username: '', password: '', useTLS: true });

  useEffect(() => {
    api.get('/email/config').then((res: any) => {
      if (res?.smtp) {
        setConfigured(true);
        setSmtp({
          host: res.smtp.host || '',
          port: res.smtp.port || 587,
          username: res.smtp.username || '',
          password: '',
          fromEmail: res.smtp.fromEmail || '',
          fromName: res.smtp.fromName || '',
        });
      }
      if (res?.imap) {
        setImap({
          host: res.imap.host || '',
          port: res.imap.port || 993,
          username: res.imap.username || '',
          password: '',
          useTLS: res.imap.useTLS !== false,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setMessage(null);
    try {
      await api.put('/email/config', smtp);
      setMessage({ text: 'Configuración SMTP guardada correctamente', type: 'success' });
      setConfigured(true);
    } catch {
      setMessage({ text: 'Error al guardar configuración SMTP', type: 'error' });
    } finally {
      setSavingSmtp(false);
    }
  };

  const saveImap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingImap(true);
    setMessage(null);
    try {
      await api.put('/email/imap-config', imap);
      setMessage({ text: 'Configuración IMAP guardada correctamente', type: 'success' });
    } catch {
      setMessage({ text: 'Error al guardar configuración IMAP', type: 'error' });
    } finally {
      setSavingImap(false);
    }
  };

  const syncImap = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      await api.post('/email/imap-sync', {});
      setMessage({ text: 'Sincronización IMAP iniciada', type: 'success' });
    } catch {
      setMessage({ text: 'Error al iniciar sincronización IMAP', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader backHref="/settings" backLabel="Volver a Configuración"
        title="Configuración de Correo"
        description={configured ? 'Configuración activa' : 'No configurado'}
      />

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">SMTP</h2>
          <form onSubmit={saveSmtp} className="space-y-4">
            <Input
              label="Host"
              value={smtp.host}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              placeholder="smtp.ejemplo.com"
              required
            />
            <Input
              label="Puerto"
              type="number"
              value={smtp.port}
              onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
              placeholder="587"
              required
            />
            <Input
              label="Usuario"
              value={smtp.username}
              onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              value={smtp.password}
              onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
              placeholder={configured ? 'â¢â¢â¢â¢â¢â¢â¢â¢' : ''}
            />
            <Input
              label="Correo remitente"
              type="email"
              value={smtp.fromEmail}
              onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
              placeholder="no-reply@ejemplo.com"
              required
            />
            <Input
              label="Nombre remitente"
              value={smtp.fromName}
              onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
              placeholder="CRM Pro"
            />
            <Button type="submit" loading={savingSmtp}>Guardar SMTP</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">IMAP</h2>
          <form onSubmit={saveImap} className="space-y-4">
            <Input
              label="Host"
              value={imap.host}
              onChange={(e) => setImap({ ...imap, host: e.target.value })}
              placeholder="imap.ejemplo.com"
            />
            <Input
              label="Puerto"
              type="number"
              value={imap.port}
              onChange={(e) => setImap({ ...imap, port: Number(e.target.value) })}
              placeholder="993"
            />
            <Input
              label="Usuario"
              value={imap.username}
              onChange={(e) => setImap({ ...imap, username: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              value={imap.password}
              onChange={(e) => setImap({ ...imap, password: e.target.value })}
              placeholder={configured ? 'â¢â¢â¢â¢â¢â¢â¢â¢' : ''}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={imap.useTLS}
                onChange={(e) => setImap({ ...imap, useTLS: e.target.checked })}
                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Usar TLS</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={savingImap}>Guardar IMAP</Button>
              <Button type="button" variant="secondary" loading={syncing} onClick={syncImap}>Sincronizar IMAP</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}


