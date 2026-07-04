'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/modules/shared/services/api';
import { Loading } from '@/modules/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { io, Socket } from 'socket.io-client';
import { formatCurrency } from '@/modules/shared/utils/format';

interface LeadStage {
  id: string;
  name: string;
  color: string;
  leads: any[];
}

export function LeadsKanbanBoard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const socket: Socket = io(socketUrl);

    socket.on('connect', () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      try {
        const { tenantId, id } = JSON.parse(storedUser);
        if (tenantId) socket.emit('joinTenant', { tenantId });
        if (id) socket.emit('joinUser', { userId: id });
      } catch {}
    });

    socket.on('lead:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const { data, isLoading } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ['leads-pipeline'],
    queryFn: async () => {
      const res = await api.get<any>('/leads/pipeline');
      return res;
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      await api.patch(`/leads/${leadId}`, { status });
    },
    onMutate: async ({ leadId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leads-pipeline'] });
      const previousData = queryClient.getQueryData(['leads-pipeline']);

      queryClient.setQueryData(['leads-pipeline'], (old: any) => {
        if (!old) return old;

        let movedLead: any = null;
        const newStages = old.stages.map((s: any) => {
          const leadIndex = s.leads.findIndex((l: any) => l.id === leadId);
          if (leadIndex > -1) {
            movedLead = s.leads[leadIndex];
            return { ...s, leads: s.leads.filter((l: any) => l.id !== leadId) };
          }
          return s;
        });

        if (movedLead) {
          const targetStageIndex = newStages.findIndex((s: any) => s.name === status);
          if (targetStageIndex > -1) {
            newStages[targetStageIndex].leads.push(movedLead);
          }
        }

        return { ...old, stages: newStages };
      });

      return { previousData };
    },
    onError: (err, vars, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['leads-pipeline'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-pipeline'] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateStatus({ leadId: draggableId, status: destination.droppableId });
  };

  if (!mounted || isLoading) return <Loading />;

  const stages = data?.stages ?? [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh] p-4 items-start">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: stage.color || 'var(--primary)', color: stage.color || 'var(--primary)' }} />
              <h3 className="font-semibold text-xs text-[var(--text)] uppercase tracking-wider">{stage.name}</h3>
              <span className="ml-auto text-[10px] bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-md font-medium">{stage.leads.length}</span>
            </div>

            <Droppable droppableId={stage.name}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-2 space-y-3 flex-1 transition-colors min-h-[200px] rounded-2xl ${
                    snapshot.isDraggingOver ? 'bg-[var(--secondary)]/50 border border-[var(--border)]' : 'bg-[var(--bg)]'
                  }`}
                >
                  {stage.leads.map((lead: any, index: number) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => router.push(`/leads/${lead.id}`)}
                          className={`bg-[var(--card-bg)] rounded-xl border p-4 cursor-pointer transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] ${
                            snapshot.isDragging
                              ? 'border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.8)] scale-105 z-50'
                              : 'border-[var(--border)] hover:border-white/20 hover:-translate-y-[2px]'
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-[var(--text)]">{lead.name}</h4>
                          {lead.value > 0 && <p className="text-sm font-bold text-[var(--text)] mt-1.5">{formatCurrency(lead.value, lead.currency)}</p>}
                          {(lead.account?.name || lead.companyName || lead.company) && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{lead.account?.name || lead.companyName || lead.company}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {lead.owner && <span className="text-xs text-[var(--text-secondary)]">{lead.owner.name}</span>}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {stage.leads.length === 0 && !snapshot.isDraggingOver && (
                    <div className="h-full min-h-[120px] bg-[var(--secondary)]/30 border border-dashed border-[var(--border)] rounded-xl flex items-center justify-center text-xs font-medium text-[var(--text-muted)] opacity-50">
                      Arrastra aquí
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
