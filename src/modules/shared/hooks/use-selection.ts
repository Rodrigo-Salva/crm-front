'use client';

import { useState, useCallback } from 'react';

export function useSelection<T extends { id: string }>() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = (items: T[]) => items.length > 0 && selected.size === items.length;

  return { selected, toggle, toggleAll, clear, allSelected };
}
