'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls,
  useNodesState, useEdgesState, addEdge, useReactFlow,
  type Node, type Edge, type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '@/modules/shared/services/api';
import { nodeTypes } from './flow-nodes';
import { NodeConfigModal } from './node-config-modal';
import type { Automation, AutomationNode } from '../constants';

const PALETTE: { type: 'action' | 'wait' | 'condition'; label: string; icon: React.ReactNode }[] = [
  {
    type: 'action', label: 'Acción',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    type: 'condition', label: 'Condición',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>,
  },
  {
    type: 'wait', label: 'Esperar',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

function CanvasInner({ automation }: { automation: Automation }) {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    automation.nodes.map((n) => ({ id: n.id, type: n.type, position: { x: n.positionX, y: n.positionY }, data: { node: n } })),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    automation.connections.map((c) => ({ id: c.id, source: c.sourceNodeId, target: c.targetNodeId, sourceHandle: c.sourceHandle })),
  );
  const [editingNode, setEditingNode] = useState<AutomationNode | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    try {
      const created = await api.post<{ id: string }>(`/automations/${automation.id}/connections`, {
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
      });
      setEdges((eds) => addEdge({ ...connection, id: created.id }, eds));
    } catch {}
  }, [automation.id, setEdges]);

  const handleNodeDragStop = useCallback(async (_event: unknown, node: Node) => {
    try {
      await api.patch(`/automations/${automation.id}/nodes/${node.id}`, { positionX: node.position.x, positionY: node.position.y });
    } catch {}
  }, [automation.id]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow') as 'action' | 'wait' | 'condition';
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    try {
      const created = await api.post<AutomationNode>(`/automations/${automation.id}/nodes`, {
        type,
        actionType: type === 'action' ? 'assign_round_robin' : undefined,
        config: type === 'wait' ? { minutes: 5 } : type === 'condition' ? { conditions: [] } : {},
        positionX: position.x,
        positionY: position.y,
      });
      setNodes((nds) => [...nds, { id: created.id, type: created.type, position: { x: created.positionX, y: created.positionY }, data: { node: created } }]);
      setEditingNode(created);
    } catch {}
  }, [automation.id, screenToFlowPosition, setNodes]);

  const handleNodeClick = useCallback((_event: unknown, node: Node) => {
    setEditingNode((node.data as any).node);
  }, []);

  const handleSaveNode = async (data: { actionType?: string; config: Record<string, any> }) => {
    if (!editingNode) return;
    setSaving(true);
    try {
      const updated = await api.patch<AutomationNode>(`/automations/${automation.id}/nodes/${editingNode.id}`, data);
      setNodes((nds) => nds.map((n) => (n.id === updated.id ? { ...n, data: { node: updated } } : n)));
      setEditingNode(null);
    } catch {} finally { setSaving(false); }
  };

  const handleDeleteNode = async () => {
    if (!editingNode) return;
    try {
      await api.delete(`/automations/${automation.id}/nodes/${editingNode.id}`);
      setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== editingNode.id && e.target !== editingNode.id));
      setEditingNode(null);
    } catch {}
  };

  const handleEdgesDelete = async (deleted: Edge[]) => {
    for (const edge of deleted) {
      try { await api.delete(`/automations/${automation.id}/connections/${edge.id}`); } catch {}
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] gap-4">
      <div className="w-48 shrink-0 space-y-2">
        {PALETTE.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/reactflow', item.type)}
            className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] cursor-grab flex items-center gap-2 text-sm text-[var(--text)] hover:border-[var(--primary)] transition-colors"
          >
            <span>{item.icon}</span>{item.label}
          </div>
        ))}
        <p className="text-xs text-[var(--text-secondary)] pt-2">
          Arrastra un bloque al lienzo para agregarlo. Haz clic en un nodo para configurarlo o conecta arrastrando desde su borde.
        </p>
      </div>

      <div className="flex-1 rounded-xl border border-[var(--border)] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={handleNodeClick}
          onEdgesDelete={handleEdgesDelete}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          deleteKeyCode={null}
          fitView
          colorMode="dark"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <NodeConfigModal
        open={!!editingNode}
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
        onDelete={editingNode?.type !== 'trigger' ? handleDeleteNode : undefined}
        saving={saving}
      />
    </div>
  );
}

export function AutomationCanvas({ automation }: { automation: Automation }) {
  return (
    <ReactFlowProvider>
      <CanvasInner automation={automation} />
    </ReactFlowProvider>
  );
}
