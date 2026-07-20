'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, PageHeader, Loading, Badge, Card } from '@/modules/shared';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Product } from '@/modules/shared/types';
import { formatCurrency } from '@/modules/shared/utils/format';

const tabOptions = [
  { id: 'info', label: 'Información' },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Product>(`/products/${id}`);
      setProduct(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load() }, [load]);

  if (loading) return <Loading />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Producto no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/products')}>Volver</Button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/products')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{product.name}</h1>
            {product.sku && <p className="text-sm text-[var(--text-secondary)]">SKU: {product.sku}</p>}
          </div>
          <Badge variant={product.active ? 'success' : 'default'}>{product.active ? 'Activo' : 'Inactivo'}</Badge>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/products/${id}/edit`)}>Editar</Button>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Precio</p>
                <p className="mt-1 text-lg font-bold text-[var(--text)]">{formatCurrency(product.price, product.currency)}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Unidad</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{product.unit}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Categoría</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{product.category?.name || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">SKU</p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{product.sku || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado</p>
                <p className="mt-1"><Badge variant={product.active ? 'success' : 'default'}>{product.active ? 'Activo' : 'Inactivo'}</Badge></p>
              </div>
              {product.description && (
                <div className="p-4 rounded-xl bg-[var(--bg)] md:col-span-2">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Descripción</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{product.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
