'use client';

import { useRouter } from 'next/navigation';
import { PageHeader, Card } from '@/modules/shared';

export default function SettingsPage() {
  const router = useRouter();

  const cards = [
    { label: 'Perfil', desc: 'Información personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'text-[var(--primary)]', bg: 'bg-blue-50' },
    { label: 'Preferencias', desc: 'Configuración general', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'text-[var(--success)]', bg: 'bg-green-50' },
    { label: 'Seguridad', desc: 'Contraseña y acceso', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-purple-600', bg: 'bg-purple-50', path: '/settings/security' },
    { label: 'Campos personalizados', desc: 'Agrega campos a tus módulos', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', color: 'text-orange-500', bg: 'bg-orange-50', path: '/settings/custom-fields' },
    { label: 'Roles y permisos', desc: 'Gestiona accesos del equipo', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', color: 'text-cyan-600', bg: 'bg-cyan-50', path: '/settings/roles' },
    { label: 'Pipeline', desc: 'Personaliza etapas de ventas', icon: 'M3 10h18M3 14h18M3 18h18M3 6h18', color: 'text-pink-600', bg: 'bg-pink-50', path: '/settings/pipeline' },
    { label: 'Equipos', desc: 'Gestiona grupos de trabajo', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/settings/teams' },
    { label: 'Importar datos', desc: 'Sube archivos CSV', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'text-teal-600', bg: 'bg-teal-50', path: '/import' },
    { label: 'Correo SMTP', desc: 'Configura el servidor de correo', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-sky-600', bg: 'bg-sky-50', path: '/settings/email' },
    { label: 'Plantillas email', desc: 'Gestiona plantillas de correo', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/settings/email-templates' },
    { label: 'Automatización', desc: 'Reglas y flujos automáticos', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'text-amber-600', bg: 'bg-amber-50', path: '/settings/automation' },
    { label: 'Webhooks', desc: 'Integraciones con servicios externos', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: 'text-violet-600', bg: 'bg-violet-50', path: '/settings/webhooks' },
    { label: 'API Keys', desc: 'Claves para integraciones API', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'text-rose-600', bg: 'bg-rose-50', path: '/settings/api-keys' },
    { label: 'WhatsApp', desc: 'Integración con WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/settings/whatsapp' },
    { label: 'IA Asistente', desc: 'Sugerencias y resúmenes automáticos', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', path: '/settings/ai' },
    { label: 'Configuración del sistema', desc: 'Variables y ajustes del tenant', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'text-slate-600', bg: 'bg-slate-50', path: '/settings/tenant-settings' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configuración" description="Personaliza tu experiencia en CRM Pro" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="cursor-pointer" onClick={() => c.path && router.push(c.path)}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${c.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{c.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{c.desc}</p>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
