'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, SearchSelect } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';
import { Lead, Currency } from '@/modules/shared/types';
import { CURRENCIES } from '@/modules/shared/utils/format';

const sourceOptions = ['web', 'referral', 'phone', 'email', 'event', 'partner', 'other'];

interface PipelineStageOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
}

export default function CreateLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [stages, setStages] = useState<PipelineStageOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'web', status: '', notes: '', value: 0, currency: 'MXN' as Currency, expectedCloseDate: '', companyId: '', companyName: '', position: '', customerStatus: '', campaignId: '', careerId: '', modalityId: '', utmSource: '', utmMedium: '', utmCampaign: '', utmTerm: '', utmContent: '' });

  useEffect(() => {
    api.get<PipelineStageOption[]>('/pipeline-stages').then((res) => {
      const list = Array.isArray(res) ? res : [];
      setStages(list);
      setForm((f) => ({ ...f, status: f.status || list[0]?.name || '' }));
    }).catch(() => {});
    api.get<CampaignOption[]>('/marketing-campaigns').then((res) => {
      setCampaigns(Array.isArray(res) ? res : []);
    }).catch(() => {});
    api.get<any[]>('/careers').then((res) => {
      setCareers(Array.isArray(res) ? res.filter(c => c.active) : []);
    }).catch(() => {});
    api.get<any[]>('/modalities').then((res) => {
      setModalities(Array.isArray(res) ? res.filter(m => m.active) : []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post<Lead>('/leads', {
        ...form,
        companyId: form.companyId || undefined,
        companyName: form.companyName || undefined,
        position: form.position || undefined,
        customerStatus: form.customerStatus || undefined,
        campaignId: form.campaignId || undefined,
        careerId: form.careerId || undefined,
        modalityId: form.modalityId || undefined,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
        utmTerm: form.utmTerm || undefined,
        utmContent: form.utmContent || undefined,
      });
      router.push(`/leads/${res.id}`);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="text-2xl font-bold text-[var(--text)]">Nuevo Lead</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre completo" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 555 123 4567" />
            <Input label="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nombre de empresa" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                {sourceOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <Input label="Valor estimado" type="number" step="0.01" value={String(form.value)} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <Input label="Fecha cierre estimada" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
            <SearchSelect label="Empresa vinculada (opcional)" value={form.companyId} onChange={(id) => setForm({ ...form, companyId: id })} endpoint="/companies" placeholder="Buscar empresa por nombre..." />
            <Input label="Nombre de empresa (libre)" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Si no está en el catálogo" />
            <Input label="Cargo / Posición" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej. Gerente de compras" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de cliente (opcional)</label>
              <select value={form.customerStatus} onChange={(e) => setForm({ ...form, customerStatus: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="">Sin estado</option>
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaña (opcional)</label>
              <select value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="">Sin campaña</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrera de interés</label>
              <select value={form.careerId} onChange={(e) => setForm({ ...form, careerId: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="">Seleccionar carrera</option>
                {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
              <select value={form.modalityId} onChange={(e) => setForm({ ...form, modalityId: e.target.value })} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]">
                <option value="">Seleccionar modalidad</option>
                {modalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-[var(--text)] mb-3 border-b border-[var(--border)] pb-2">Seguimiento (UTMs)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Input label="UTM Source" value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} placeholder="Ej. google, facebook" />
                <Input label="UTM Medium" value={form.utmMedium} onChange={(e) => setForm({ ...form, utmMedium: e.target.value })} placeholder="Ej. cpc, banner" />
                <Input label="UTM Campaign" value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} placeholder="Ej. promo_verano" />
                <Input label="UTM Term" value={form.utmTerm} onChange={(e) => setForm({ ...form, utmTerm: e.target.value })} placeholder="Ej. curso de ingles" />
                <Input label="UTM Content" value={form.utmContent} onChange={(e) => setForm({ ...form, utmContent: e.target.value })} placeholder="Ej. boton_rojo" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400" placeholder="Notas adicionales..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Lead</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
