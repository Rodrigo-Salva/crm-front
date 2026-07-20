'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Loading, Badge } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { formatCurrency } from '@/modules/shared/utils/format';

export default function PortalDashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const stored = localStorage.getItem('portal_contact');
      if (stored) {
        setContact(JSON.parse(stored));
      }

      // Fetch pending quotes
      const resQuotes = await api.get<any>('/quotes');
      setQuotes(Array.isArray(resQuotes) ? resQuotes.slice(0, 5) : []);

      // Fetch pending invoices
      const resInvoices = await api.get<any>('/invoices');
      setInvoices(Array.isArray(resInvoices) ? resInvoices.slice(0, 5) : []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Loading />;

  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const totalDebt = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">¡Hola, {contact?.name?.split(' ')[0] || 'Cliente'}!</h1>
        <p className="text-[var(--text-secondary)]">Bienvenido a tu portal. Aquí puedes consultar el estado de tus proyectos, facturas y contratos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 border-t-4 border-t-blue-500">
          <p className="text-sm font-semibold text-[var(--text-muted)] uppercase">Proyectos Activos</p>
          <p className="text-4xl font-bold mt-2 text-[var(--text)]">1</p>
        </Card>
        
        <Card className="p-6 border-t-4 border-t-green-500">
          <p className="text-sm font-semibold text-[var(--text-muted)] uppercase">Cotizaciones Pendientes</p>
          <p className="text-4xl font-bold mt-2 text-[var(--text)]">{quotes.filter(q => q.status === 'sent').length}</p>
        </Card>

        <Card className={`p-6 border-t-4 ${totalDebt > 0 ? 'border-t-red-500' : 'border-t-[var(--border)]'}`}>
          <p className="text-sm font-semibold text-[var(--text-muted)] uppercase">Saldo Pendiente</p>
          <p className={`text-4xl font-bold mt-2 ${totalDebt > 0 ? 'text-red-500' : 'text-[var(--text)]'}`}>
            {formatCurrency(totalDebt, 'MXN')}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-[var(--bg)] border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--text)]">Tus últimas facturas</h3>
          </div>
          <div className="p-4">
            {invoices.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm text-center py-4">No tienes facturas recientes.</p>
            ) : (
              <ul className="space-y-4">
                {invoices.map(inv => (
                  <li key={inv.id} className="flex justify-between items-center p-3 hover:bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    <div>
                      <p className="font-semibold text-[var(--text)]">{inv.number}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Vence: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[var(--text)]">{formatCurrency(inv.amount, inv.currency)}</p>
                      <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-[var(--bg)] border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--text)]">Cotizaciones por revisar</h3>
          </div>
          <div className="p-4">
            {quotes.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm text-center py-4">No tienes cotizaciones pendientes.</p>
            ) : (
              <ul className="space-y-4">
                {quotes.map(q => (
                  <li key={q.id} className="flex justify-between items-center p-3 hover:bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    <div>
                      <p className="font-semibold text-[var(--text)]">{q.number}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold text-[var(--text)]">{formatCurrency(q.grandTotal, q.currency)}</p>
                      <Badge variant="primary">Ver detalle</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
