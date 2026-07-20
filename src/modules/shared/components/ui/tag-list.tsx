'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/modules/shared/services/api';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface EntityTagLink {
  id: string;
  tag: Tag;
}

interface TagListProps {
  entity: string;
  entityId: string;
}

export function TagList({ entity, entityId }: TagListProps) {
  const [links, setLinks] = useState<EntityTagLink[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<EntityTagLink[]>(`/tags/entity/${entity}/${entityId}`);
      setLinks(Array.isArray(res) ? res : []);
    } catch {}
  }, [entity, entityId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<Tag[]>('/tags').then((res) => setAllTags(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAttach = async (tagName: string) => {
    const name = tagName.trim();
    if (!name) return;
    try {
      await api.post('/tags/attach', { entity, entityId, tagName: name });
      setInput('');
      setOpen(false);
      load();
    } catch {}
  };

  const handleDetach = async (entityTagId: string) => {
    try {
      await api.delete(`/tags/${entityTagId}`);
      load();
    } catch {}
  };

  const suggestions = allTags.filter(
    (t) => t.name.includes(input.trim().toLowerCase()) && !links.some((l) => l.tag.id === t.id),
  );

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <span
          key={link.id}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${link.tag.color}20`, color: link.tag.color }}
        >
          {link.tag.name}
          <button type="button" onClick={() => handleDetach(link.id)} className="hover:opacity-70">×</button>
        </span>
      ))}

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAttach(input); } }}
          placeholder="+ agregar tag"
          className="w-28 h-7 px-2 rounded-full border border-dashed border-[var(--border)] bg-transparent text-xs text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
        {open && input && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAttach(t.name)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--sidebar-hover)]"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
