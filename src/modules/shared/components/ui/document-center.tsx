'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/modules/shared/services/api';
import { FileAttachments } from '@/modules/uploads/components/file-attachments';
import { formatCurrency } from '@/modules/shared/utils/format';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

interface DocumentCenterProps {
  entity: 'lead' | 'company';
  entityId: string;
}

export function DocumentCenter({ entity, entityId }: DocumentCenterProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filterKey = entity === 'lead' ? 'leadId' : 'companyId';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [quotesRes, contractsRes] = await Promise.all([
        api.get<any>(`/quotes?${filterKey}=${entityId}`),
        api.get<any>(`/contracts?${filterKey}=${entityId}`),
      ]);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : quotesRes?.data || []);
      setContracts(Array.isArray(contractsRes) ? contractsRes : []);
    } catch {} finally { setLoading(false); }
  }, [filterKey, entityId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Archivos</p>
        <FileAttachments entity={entity} entityId={entityId} />
      </div>

      <div>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Cotizaciones</p>
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Sin cotizaciones</p>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                <Link href={`/quotes/${q.id}`} className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)]">
                  {q.number} · {formatCurrency(q.grandTotal, q.currency)} · {q.status}
                </Link>
                <a
                  href={`${API_BASE}/quotes/${q.id}/pdf?token=${getToken()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Descargar PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Contratos</p>
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
        ) : contracts.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Sin contratos</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--celeste-400)]"
              >
                <span className="text-sm font-medium text-[var(--text)]">{c.number}</span>
                <span className="text-xs text-[var(--text-secondary)]">{c.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
