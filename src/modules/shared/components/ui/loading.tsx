export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Cargando...</p>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}
