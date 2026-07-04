interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/10 transition-all duration-200 ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}
