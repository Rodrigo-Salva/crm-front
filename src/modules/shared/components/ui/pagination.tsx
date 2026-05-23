interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-[var(--border)] rounded-b-lg">
      <div className="text-sm text-[var(--text-muted)]">
        <span className="font-medium text-gray-700">{Math.min((page - 1) * limit + 1, total)}</span>
        {' '}-{' '}
        <span className="font-medium text-gray-700">{Math.min(page * limit, total)}</span>
        {' '}de{' '}
        <span className="font-medium text-gray-700">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--sidebar-hover)] transition-colors text-gray-600"
        >
          Anterior
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-sm rounded-lg transition-colors ${
              p === page
                ? 'bg-[var(--primary)] text-white'
                : 'text-gray-600 hover:bg-[var(--sidebar-hover)]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--sidebar-hover)] transition-colors text-gray-600"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
