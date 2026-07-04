'use client';

import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex bg-[var(--secondary)] p-1 rounded-xl border border-[var(--border)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" role="tablist">
      <nav className="flex gap-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${active === tab.id
                ? 'bg-[var(--card-bg)] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[var(--border)]'
                : 'border border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-[var(--sidebar-hover)]'
              }
            `}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
