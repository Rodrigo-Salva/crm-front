import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, description, actions, backHref, backLabel = 'Volver' }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 animate-fade-in">
      <div className="flex flex-col items-start">
        {backHref && (
          <Link href={backHref} className="flex items-center text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-2 group">
            <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {backLabel}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
