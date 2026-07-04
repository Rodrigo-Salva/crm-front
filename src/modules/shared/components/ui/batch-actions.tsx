'use client';

import { Button } from './button';

interface BatchActionsProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  onEdit?: () => void;
  loading?: boolean;
}

export function BatchActionsBar({ count, onDelete, onClear, onEdit, loading }: BatchActionsProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border-b border-[var(--border)] sticky top-0 z-10">
      <span className="text-sm font-medium text-[var(--text)]">
        {count} seleccionado{count !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        {onEdit && <Button size="sm" variant="secondary" onClick={onEdit}>Editar</Button>}
        <Button size="sm" variant="secondary" onClick={onClear}>Deseleccionar</Button>
        <Button size="sm" variant="danger" onClick={onDelete} loading={loading}>
          Eliminar seleccionados
        </Button>
      </div>
    </div>
  );
}

