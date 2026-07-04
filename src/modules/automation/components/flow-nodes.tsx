'use client';

import { Handle, Position } from '@xyflow/react';
import { EVENTS, OPERATORS, CONDITION_FIELDS, ACTION_TYPES } from '../constants';
import type { AutomationNode } from '../constants';

function BoltIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}

function NodeShell({
  color, icon, title, subtitle, showTarget = true, children,
}: {
  color: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  showTarget?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-2 ${color} bg-[var(--card-bg)] shadow-md px-4 py-3 min-w-[200px] cursor-pointer relative`}>
      {showTarget && <Handle type="target" position={Position.Left} className="w-2! h-2!" />}
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text)] truncate">{title}</p>
          <p className="text-[11px] text-[var(--text-secondary)] truncate">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function describeCondition(cond: { field: string; operator: string; value: string }) {
  const fieldLabel = CONDITION_FIELDS.find((f) => f.value === cond.field)?.label || cond.field;
  const operatorLabel = OPERATORS.find((o) => o.value === cond.operator)?.label || cond.operator;
  return `${fieldLabel} ${operatorLabel.toLowerCase()} "${cond.value}"`;
}

export function TriggerNodeView({ data }: { data: { node: AutomationNode } }) {
  const config = data.node.config || {};
  const eventLabel = EVENTS.find((e) => e.value === config.event)?.label || config.event || 'Sin evento';
  const conditionsCount = (config.conditions || []).length;
  return (
    <NodeShell
      color="border-blue-400"
      icon={<BoltIcon />}
      title={`Cuando pasa: ${eventLabel}`}
      subtitle={conditionsCount ? `Solo si se cumplen ${conditionsCount} condición(es)` : 'Se dispara siempre'}
      showTarget={false}
    >
      <Handle type="source" position={Position.Right} className="w-2! h-2!" />
    </NodeShell>
  );
}

export function ActionNodeView({ data }: { data: { node: AutomationNode } }) {
  const label = ACTION_TYPES.find((a) => a.value === data.node.actionType)?.label || 'Acción';
  return (
    <NodeShell color="border-emerald-400" icon={<GearIcon />} title={label} subtitle="Hace esta acción">
      <Handle type="source" position={Position.Right} className="w-2! h-2!" />
    </NodeShell>
  );
}

export function WaitNodeView({ data }: { data: { node: AutomationNode } }) {
  const minutes = (data.node.config || {}).minutes ?? 0;
  return (
    <NodeShell color="border-amber-400" icon={<ClockIcon />} title="Esperar" subtitle={`${minutes} minuto(s) antes de seguir`}>
      <Handle type="source" position={Position.Right} className="w-2! h-2!" />
    </NodeShell>
  );
}

export function ConditionNodeView({ data }: { data: { node: AutomationNode } }) {
  const conditions = ((data.node.config || {}).conditions || []) as { field: string; operator: string; value: string }[];
  const subtitle = conditions.length
    ? conditions.map(describeCondition).join(' y ')
    : 'Sin condiciones configuradas';
  return (
    <div className={`rounded-xl border-2 border-violet-400 bg-[var(--card-bg)] shadow-md px-4 py-3 min-w-[220px] cursor-pointer relative`}>
      <Handle type="target" position={Position.Left} className="w-2! h-2!" />
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-secondary)]"><FunnelIcon /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text)] truncate">Solo si se cumple</p>
          <p className="text-[11px] text-[var(--text-secondary)] truncate">{subtitle}</p>
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-end text-[10px] text-[var(--text-secondary)] pr-1">
          <span>Sí</span>
        </div>
        <div className="flex items-center justify-end text-[10px] text-[var(--text-secondary)] pr-1">
          <span>No</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="yes" style={{ top: 'calc(100% - 22px)' }} className="w-2! h-2!" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: 'calc(100% - 6px)' }} className="w-2! h-2!" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNodeView,
  action: ActionNodeView,
  wait: WaitNodeView,
  condition: ConditionNodeView,
};
