'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navLinks = [
  { href: '/portal', label: 'Dashboard' },
  { href: '/portal/tickets', label: 'Tickets' },
  { href: '/portal/quotes', label: 'Cotizaciones' },
  { href: '/portal/contracts', label: 'Contratos' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [contact, setContact] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('portal_token');
    const stored = localStorage.getItem('portal_contact');
    if (!token || !stored) {
      router.push('/portal/login');
      return;
    }
    setContact(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_contact');
    router.push('/portal/login');
  };

  if (!mounted || !contact) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--card-bg)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-[var(--text)]">Portal del Cliente</h1>
          </Link>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname === link.href
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portal/profile"
            className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
            title="Mi perfil"
          >
            {contact.name?.charAt(0)?.toUpperCase() || 'U'}
          </Link>
          <span className="text-sm text-[var(--text-secondary)]">{contact.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--danger)] hover:text-red-700 font-medium transition-colors"
          >
            Cerrar sesiÃ³n
          </button>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}

