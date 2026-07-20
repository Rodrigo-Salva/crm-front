'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, PageHeader, Card, Loading, Badge, Modal, Input, HealthBadge, TagList, DocumentCenter } from '@/modules/shared';
import { PlaybookRunsList } from '@/modules/playbooks/components/playbook-runs-list';
import { Tabs } from '@/modules/shared/components/ui/tab';
import { api } from '@/modules/shared/services/api';
import { Lead } from '@/modules/shared/types';
import { ActivityTimeline } from '@/modules/activities/components/activity-timeline';
import { NotesList } from '@/modules/notes/components/notes-list';
import { AuditTimeline } from '@/modules/audit/components/audit-timeline';
import { FileAttachments } from '@/modules/uploads/components/file-attachments';
import { formatCurrency } from '@/modules/shared/utils/format';

const sourceLabels: Record<string, string> = {
  web: 'Web',
  referral: 'Referido',
  phone: 'Teléfono',
  email: 'Correo',
  event: 'Evento',
  partner: 'Socio',
  other: 'Otro',
};

const tabOptions = [
  { id: 'info', label: 'Información' },
  { id: 'quotes', label: 'Cotizaciones' },
  { id: 'email', label: 'Correo' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
  { id: 'audit', label: 'Historial' },
  { id: 'files', label: 'Archivos' },
  { id: 'documents', label: 'Documentos' },
  { id: 'playbooks', label: 'Playbooks' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalPassword, setPortalPassword] = useState('');
  const [portalSaving, setPortalSaving] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, fieldsRes] = await Promise.all([
        api.get<Lead>(`/leads/${id}`),
        api.get<any[]>('/custom-fields?entity=lead').catch(() => []),
      ]);
      setLead(leadRes);
      setCustomFields(Array.isArray(fieldsRes) ? fieldsRes : []);
    } catch {
      console.error('Error loading lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleTogglePortal = async (enable: boolean) => {
    setPortalSaving(true);
    try {
      await api.patch(`/auth/leads/${id}/portal-access`, { enable, password: portalPassword || undefined });
      setPortalOpen(false);
      setPortalPassword('');
      load();
    } catch {
      console.error('Error toggling portal access');
    } finally {
      setPortalSaving(false);
    }
  };

  const handleRecalculateScore = async () => {
    setScoreLoading(true);
    try {
      await api.post(`/leads/${id}/recalculate-score`, {});
      load();
    } catch {
      console.error('Error recalculating score');
    } finally {
      setScoreLoading(false);
    }
  };

  const handleRecalculateHealth = async () => {
    setHealthLoading(true);
    try {
      await api.post(`/leads/${id}/recalculate-health`, {});
      load();
    } catch {
      console.error('Error recalculating health');
    } finally {
      setHealthLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!lead) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Lead no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/leads')}>Volver</Button>
    </div>
  );

  const sourceLabel = sourceLabels[lead.source] || lead.source;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/leads')} className="p-2 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{lead.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{lead.position ? `${lead.position} · ` : ''}{lead.companyName || lead.account?.name || 'Sin empresa'}</p>
          </div>
          <Badge variant="default">{lead.status}</Badge>
          {lead.subPhase && <Badge variant="info">{lead.subPhase.name}</Badge>}
          <Badge variant="default">{sourceLabel}</Badge>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {lead.score}
          </div>
          {lead.healthStatus && lead.healthStatus !== 'unknown' && (
            <HealthBadge status={lead.healthStatus} score={lead.healthScore} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {lead.value > 0 && <p className="text-2xl font-bold text-[var(--text)] mr-4">{formatCurrency(lead.value, lead.currency)}</p>}
          <Button variant="secondary" loading={scoreLoading} onClick={handleRecalculateScore}>Recalcular Score</Button>
          <Button variant="secondary" loading={healthLoading} onClick={handleRecalculateHealth}>Recalcular Salud</Button>
          <Button variant="secondary" onClick={() => setPortalOpen(true)}>Acceso al Portal</Button>
          <Button onClick={() => router.push(`/leads/${id}/edit`)}>Editar</Button>
        </div>
      </div>

      <Card padding={false}>
        <Tabs tabs={tabOptions} active={activeTab} onChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Email</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.email || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Teléfono</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.phone || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Empresa</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.company || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Valor estimado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.value ? formatCurrency(lead.value, lead.currency) : '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Cierre estimado</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Empresa vinculada</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.account?.name || lead.companyName || '—'}</p>
                  {lead.position && <p className="text-xs text-[var(--text-secondary)]">{lead.position}</p>}
                </div>
                {lead.referredByLead && (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Referido por</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.referredByLead.name}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-[var(--bg)] md:col-span-2">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Tags</p>
                  <TagList entity="lead" entityId={lead.id} />
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Estado de cliente</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.customerStatus || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Campaña</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.campaign?.name || '—'}</p>
                  {lead.campaign?.channel && <p className="text-xs text-[var(--text-secondary)]">{lead.campaign.channel}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Notas</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)] whitespace-pre-wrap">{lead.notes || '—'}</p>
                </div>
                {lead.career && (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Carrera</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.career.name}</p>
                  </div>
                )}
                {lead.modality && (
                  <div className="p-4 rounded-xl bg-[var(--bg)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Modalidad</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.modality.name}</p>
                  </div>
                )}
                {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
                  <>
                    <div className="p-4 rounded-xl bg-[var(--bg)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">UTM Source</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.utmSource || '—'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">UTM Medium</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.utmMedium || '—'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">UTM Campaign</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.utmCampaign || '—'}</p>
                    </div>
                    {lead.utmTerm && (
                      <div className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">UTM Term</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.utmTerm}</p>
                      </div>
                    )}
                    {lead.utmContent && (
                      <div className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">UTM Content</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">{lead.utmContent}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {customFields.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Campos personalizados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {customFields.map((f: any) => (
                      <div key={f.id} className="p-4 rounded-xl bg-[var(--bg)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{f.label}</p>
                        <p className="mt-1 text-sm font-medium text-[var(--text)]">
                          {lead.customFields?.[f.name] ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'quotes' && <RelatedQuotes leadId={lead.id} />}

          {activeTab === 'email' && <EmailHistory leadId={lead.id} />}

          {activeTab === 'activity' && (
            <ActivityTimeline leadId={lead.id} />
          )}

          {activeTab === 'notes' && (
            <NotesList relatedType="lead" relatedId={lead.id} />
          )}

          {activeTab === 'audit' && (
            <AuditTimeline entity="lead" entityId={lead.id} />
          )}

          {activeTab === 'files' && <FileAttachments entity="lead" entityId={lead.id} />}
          {activeTab === 'documents' && <DocumentCenter entity="lead" entityId={lead.id} />}

          {activeTab === 'playbooks' && <PlaybookRunsList leadId={lead.id} />}
        </div>
      </Card>

      <Modal open={portalOpen} onClose={() => setPortalOpen(false)} title="Acceso al Portal">
        <div className="space-y-4">
          <Input
            label="Nueva contraseña (opcional al activar)"
            type="password"
            value={portalPassword}
            onChange={(e) => setPortalPassword(e.target.value)}
            placeholder="Dejar vacío para no cambiarla"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => handleTogglePortal(false)} loading={portalSaving}>Desactivar acceso</Button>
            <Button type="button" onClick={() => handleTogglePortal(true)} loading={portalSaving} disabled={!portalPassword}>Activar acceso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RelatedQuotes({ leadId }: { leadId: string }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any>(`/quotes?leadId=${leadId}`).then((res: any) => setQuotes(Array.isArray(res) ? res : res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [leadId]);
  if (loading) return <Loading />;
  if (!quotes.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin cotizaciones relacionadas</p>;
  return <div className="space-y-2">{quotes.map((q: any) => <RelatedRow key={q.id} href={`/quotes/${q.id}`} label={q.number} sub={`${formatCurrency(q.grandTotal, q.currency)} · ${q.status}`} />)}</div>;
}

function EmailHistory({ leadId }: { leadId: string }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any[]>(`/email/history?leadId=${leadId}`).then(setEmails).catch(() => {}).finally(() => setLoading(false));
  }, [leadId]);
  if (loading) return <Loading />;
  if (!emails.length) return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Sin correos electrónicos</p>;
  return (
    <div className="space-y-3">
      {emails.map((e: any) => (
        <div key={e.id} className="p-4 rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${e.direction === 'outbound' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{e.direction === 'outbound' ? 'Enviado' : 'Recibido'}</span>
              <span className="text-sm font-medium text-[var(--text)]">{e.subject}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{new Date(e.sentAt).toLocaleString('es-MX')}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {e.direction === 'outbound' ? `Para: ${e.toEmail}` : `De: ${e.fromEmail}`}
            {e.openedAt && <span className="ml-2 text-green-600">· Abierto</span>}
          </p>
          <div className="mt-2 text-sm text-[var(--text)] line-clamp-2" dangerouslySetInnerHTML={{ __html: e.body?.substring(0, 200) || '' }} />
        </div>
      ))}
    </div>
  );
}

function RelatedRow({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors border border-[var(--border)]">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <span className="text-xs text-[var(--text-secondary)]">{sub}</span>
    </Link>
  );
}
