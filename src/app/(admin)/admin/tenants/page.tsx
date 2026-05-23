'use client';

import { useState, useEffect } from 'react';
import { Button, PageHeader, Card, Badge, Input, Loading } from '@/modules/shared';
import { adminApi } from '@/modules/admin/services/admin-api';
import { Tenant } from '@/modules/admin/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
  suspended: { label: 'Suspendido', variant: 'danger' },
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', domain: '' });

  const loadTenants = async () => {
    try {
      const res = await adminApi.listTenants();
      setTenants(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTenants() }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createTenant(form);
      setShowForm(false);
      setForm({ name: '', slug: '', domain: '' });
      loadTenants();
    } catch (err) {
      console.error('Failed to create tenant', err);
    }
  };

  const toggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.updateTenant(tenant.id, { status: newStatus as any });
      loadTenants();
    } catch (err) {
      console.error('Failed to update tenant', err);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Superadmin - Tenants"
        description="Gestiona todos los tenants del sistema"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Crear Tenant'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Nombre del tenant"
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generado"
              />
              <Input
                label="Dominio"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="ejemplo.com"
              />
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </Card>
      )}

      <Card padding={false}>
        {loading ? (
          <Loading />
        ) : (
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                {['Nombre', 'Slug', 'Dominio', 'Estado', 'Creado', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider bg-gray-50/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tenants.map((tenant) => {
                const cfg = statusConfig[tenant.status] || { label: tenant.status, variant: 'default' as const };
                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-[var(--text)]">{tenant.name}</td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">{tenant.slug}</td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">{tenant.domain || '—'}</td>
                    <td className="px-5 py-3.5"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus(tenant)}
                        className={`text-sm font-medium transition-colors ${
                          tenant.status === 'active' ? 'text-[var(--danger)] hover:text-red-700' : 'text-[var(--success)] hover:text-green-700'
                        }`}
                      >
                        {tenant.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
