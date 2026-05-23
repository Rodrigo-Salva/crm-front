'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Card, Badge } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiGet(path: string) {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  sent: { label: 'Enviada', variant: 'primary' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  converted: { label: 'Convertida', variant: 'info' },
};

export default function PortalQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/quotes/${id}`).then((res) => {
      setQuote(res);
    }).catch(() => router.push('/portal/quotes'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!quote) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
  const qBadge = statusBadge[quote.status] || { label: quote.status, variant: 'default' as const };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-50 text-blue-700',
      approved: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-700',
      converted: 'bg-purple-50 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/portal/quotes')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Cotización {quote.number}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{quote.notes?.substring(0, 100) || 'Sin notas'}</p>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor(quote.status)}`}>{qBadge.label}</span>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Productos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Producto</th>
                <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Cant.</th>
                <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">P.U.</th>
                <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Desc.</th>
                <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-[var(--border)]">
                  <td className="py-2 px-3">{item.product?.name || item.description}</td>
                  <td className="text-right py-2 px-3">{item.quantity}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2 px-3">{item.discountPercent || 0}%</td>
                  <td className="text-right py-2 px-3 font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between px-3"><span className="text-[var(--text-secondary)]">Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
          <div className="flex justify-between px-3"><span className="text-[var(--text-secondary)]">Descuento</span><span className="text-red-500">-{formatCurrency(quote.discountTotal)}</span></div>
          <div className="flex justify-between px-3"><span className="text-[var(--text-secondary)]">Impuesto</span><span>{formatCurrency(quote.taxTotal)}</span></div>
          <div className="flex justify-between px-3 pt-2 border-t border-[var(--border)] font-bold text-base">
            <span>Total</span><span className="text-[var(--primary)]">{formatCurrency(quote.grandTotal)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Detalles</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[var(--text-secondary)]">Estado:</span> {qBadge.label}</div>
          <div><span className="text-[var(--text-secondary)]">Creado:</span> {new Date(quote.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          {quote.notes && <div className="col-span-2"><span className="text-[var(--text-secondary)]">Notas:</span> {quote.notes}</div>}
        </div>
      </Card>
    </div>
  );
}
