'use client';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
}

export function Table<T extends Record<string, any>>({ columns, data, onRowClick, selected, onToggle, onToggleAll, allSelected }: TableProps<T>) {
  const selectable = !!onToggle;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl w-full border border-[var(--border)] overflow-hidden animate-fade-in shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead>
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left bg-[var(--sidebar-bg)] border-b border-[var(--border)] w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleAll?.()}
                    className="w-4 h-4 rounded border-[var(--border)] bg-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--sidebar-bg)] border-b border-[var(--border)] ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((item, i) => {
              const id = item.id ?? i;
              const checked = selected?.has(id);
              return (
                <tr
                  key={id}
                  onClick={() => { if (!selectable) onRowClick?.(item); }}
                  className={`transition-colors duration-150 ${selectable ? '' : onRowClick ? 'cursor-pointer' : ''} hover:bg-[var(--sidebar-hover)] ${checked ? 'bg-[var(--primary-light)]' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3.5 text-sm w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(id)}
                        className="w-4 h-4 rounded border-[var(--border)] bg-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-sm text-[var(--text)] whitespace-nowrap">
                      {col.render ? col.render(item) : item[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>No se encontraron registros</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
