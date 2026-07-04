'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUiStore } from '../../store/ui-store';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'General', heading: true },
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/reports', label: 'Reportes', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },

  { label: 'Ventas', heading: true },
  { href: '/leads', label: 'Leads', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { href: '/companies', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/quotes', label: 'Cotizaciones', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/contracts', label: 'Contratos', icon: 'M9 12h6m-6 4h3m-7 5h10a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0012.586 3H6a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { href: '/products', label: 'Productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },

  { label: 'Productividad', heading: true },
  { href: '/tasks', label: 'Tareas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },

  { label: 'Marketing', heading: true },
  { href: '/campaigns', label: 'Email Marketing', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '/settings/marketing-campaigns', label: 'Campañas', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.04 1.272l-3.232-3.232a1.76 1.76 0 00-1.244-.514H2.08A1.76 1.76 0 01.32 15.006v-6.02a1.76 1.76 0 011.76-1.76h1.424c.467 0 .915-.186 1.245-.515l3.231-3.233A1.76 1.76 0 0111 5.882zm8.167 2.293a8.8 8.8 0 010 7.65M16.81 9.716a4.4 4.4 0 010 4.568M4.4 12c0-.484.044-.957.124-1.416' },

  { label: 'Soporte', heading: true },
  { href: '/tickets', label: 'Tickets', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },

  { label: 'Administración', heading: true },
  { href: '/settings/teams', label: 'Equipos', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/settings/sales-goals', label: 'Metas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/settings/automation', label: 'Automatizaciones', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isMobileMenuOpen, closeMobileMenu } = useUiStore();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === 'seller') {
      if (item.href?.startsWith('/settings') || item.href === '/campaigns' || item.href === '/reports' || item.href === '/settings/marketing-campaigns') {
        return false;
      }
    }
    return true;
  });

  // Limpiar headings que no tengan elementos debajo (opcional, pero buena práctica)
  const renderItems = [];
  for (let i = 0; i < filteredNavItems.length; i++) {
    const item = filteredNavItems[i];
    if (item.heading) {
      // Si es el último elemento, o el siguiente también es un heading, no lo añadimos
      if (i + 1 < filteredNavItems.length && !filteredNavItems[i + 1].heading) {
        renderItems.push(item);
      }
    } else {
      renderItems.push(item);
    }
  }

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`
        bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] 
        flex flex-col transition-all duration-300 ease-in-out
        fixed md:relative z-50 h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16 w-64' : 'w-64'}
      `}>
        <div className="flex items-center h-16 px-4 border-b border-[var(--sidebar-border)] flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-white font-bold text-lg tracking-tight">Conecta</span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {renderItems.map((item, index) => {
            if (item.heading) {
              if (collapsed) return <div key={index} className="my-3 mx-2 border-t border-[var(--sidebar-border)]" />;
              return (
                <div key={index} className="px-3 pt-4 pb-1 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {item.label}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--celeste-600)]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-[var(--celeste-500)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--celeste-500)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--sidebar-border)]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--sidebar-hover)] transition-all"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};
