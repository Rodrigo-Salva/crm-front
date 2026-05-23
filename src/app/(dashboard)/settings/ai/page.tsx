'use client';

import { useState } from 'react';
import { PageHeader, Card, Button, Input, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const ENTITY_TYPES = [
  { value: 'contact', label: 'Contacto' },
  { value: 'deal', label: 'Negocio' },
  { value: 'ticket', label: 'Ticket' },
];

export default function AiSettingsPage() {
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const [entity, setEntity] = useState('contact');
  const [entityId, setEntityId] = useState('');
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  const handleSummarize = async () => {
    if (!content.trim()) return;
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await api.post<{ summary: string }>('/ai/summarize', { content });
      setSummary(res.summary);
    } catch {} finally { setSummarizing(false); }
  };

  const handleSuggestions = async () => {
    if (!entityId.trim()) return;
    setFetchingSuggestions(true);
    setSuggestions(null);
    try {
      const res = await api.get<string[]>(`/ai/suggestions/${entity}/${entityId}`);
      setSuggestions(Array.isArray(res) ? res : []);
    } catch {} finally { setFetchingSuggestions(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="AI Assistant" description="Herramientas de inteligencia artificial" />

      <Card>
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">Resumir texto</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Pega aquí el contenido que deseas resumir..."
          rows={6}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] resize-y"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={handleSummarize} loading={summarizing} disabled={!content.trim()}>
            Resumir
          </Button>
          {summary !== null && (
            <span className="text-xs text-[var(--text-secondary)]">Resumen generado</span>
          )}
        </div>
        {summarizing && <Loading />}
        {summary && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/20">
            <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">Sugerencias por entidad</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Entidad</label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              {ENTITY_TYPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div className="flex-[2]">
            <Input
              label="ID de la entidad"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Ej: 123"
            />
          </div>
          <Button onClick={handleSuggestions} loading={fetchingSuggestions} disabled={!entityId.trim()}>
            Buscar sugerencias
          </Button>
        </div>

        {fetchingSuggestions && <Loading />}

        {suggestions && suggestions.length === 0 && (
          <p className="mt-4 text-sm text-[var(--text-secondary)] text-center py-6">No se encontraron sugerencias</p>
        )}

        {suggestions && suggestions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="p-3 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/20 text-sm text-[var(--text)]"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
