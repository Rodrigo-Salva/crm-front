'use client';

import { useRouter } from 'next/navigation';
import { PageHeader, Card } from '@/modules/shared';

export default function SettingsPage() {
  const router = useRouter();

  const cards = [
    { label: 'Perfil', desc: 'Información personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Preferencias', desc: 'Configuración general', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Seguridad', desc: 'Contraseña y acceso', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', path: '/settings/security' },
    { label: 'Campos personalizados', desc: 'Agrega campos a tus módulos', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', path: '/settings/custom-fields' },
    { label: 'Roles y permisos', desc: 'Gestiona accesos del equipo', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', path: '/settings/roles' },
    { label: 'Pipeline', desc: 'Personaliza etapas de ventas', icon: 'M3 10h18M3 14h18M3 18h18M3 6h18', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', path: '/settings/pipeline' },
    { label: 'Leads duplicados', desc: 'Detecta y fusiona leads repetidos', icon: 'M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', path: '/leads/duplicates' },
    { label: 'Metas de venta', desc: 'Cuotas mensuales por vendedor', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', path: '/settings/sales-goals' },
    { label: 'Formularios de captura', desc: 'Captura leads desde tu sitio web', icon: 'M9 12h6m-6 4h3m-7 5h11a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0013.586 3H6a2 2 0 00-2 2v13a2 2 0 002 2z', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', path: '/settings/lead-forms' },
    { label: 'Campañas de marketing', desc: 'Mide el ROI de tu inversión en leads', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.04 1.272l-3.232-3.232a1.76 1.76 0 00-1.244-.514H2.08A1.76 1.76 0 01.32 15.006v-6.02a1.76 1.76 0 011.76-1.76h1.424c.467 0 .915-.186 1.245-.515l3.231-3.233A1.76 1.76 0 0111 5.882z', color: 'text-lime-400', bg: 'bg-lime-500/10 border-lime-500/20', path: '/settings/marketing-campaigns' },
    { label: 'Equipos', desc: 'Gestiona grupos de trabajo', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', path: '/settings/teams' },
    { label: 'Importar datos', desc: 'Sube archivos CSV', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', path: '/import' },
    { label: 'Correo SMTP', desc: 'Configura el servidor de correo', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', path: '/settings/email' },
    { label: 'Plantillas email', desc: 'Gestiona plantillas de correo', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', path: '/settings/email-templates' },
    { label: 'Automatización', desc: 'Reglas y flujos automáticos', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', path: '/settings/automation' },
    { label: 'Playbooks', desc: 'Secuencias de tareas para onboarding y renovaciones', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', path: '/settings/playbooks' },
    { label: 'Webhooks', desc: 'Integraciones con servicios externos', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', path: '/settings/webhooks' },
    { label: 'API Keys', desc: 'Claves para integraciones API', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', path: '/settings/api-keys' },
    { label: 'WhatsApp', desc: 'Integración con WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', path: '/settings/whatsapp' },
    { label: 'IA Asistente', desc: 'Sugerencias y resúmenes automáticos', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20', path: '/settings/ai' },
    { label: 'Configuración del sistema', desc: 'Variables y ajustes del tenant', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', path: '/settings/tenant-settings' },
    { label: 'Carreras', desc: 'Catálogo de carreras', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', path: '/settings/careers' },
    { label: 'Modalidades', desc: 'Catálogo de modalidades', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', path: '/settings/modalities' },
    { label: 'SLA de tickets', desc: 'Tiempos de respuesta y resolución por prioridad', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', path: '/settings/sla' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configuración" description="Personaliza tu experiencia en CRM Pro" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="cursor-pointer group h-full" onClick={() => c.path && router.push(c.path)}>
            <Card className="h-full border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--sidebar-hover)] hover:border-white/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:-translate-y-1">
              <div className="flex flex-col gap-4 p-2">
                <div className={`w-12 h-12 rounded-xl border ${c.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-[0_4px_16px_currentColor]`} style={{ color: c.color.replace('text-', '') === c.color ? 'var(--primary)' : 'transparent' }}>
                  <svg className={`w-6 h-6 ${c.color} drop-shadow-md`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-white transition-colors">{c.label}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

