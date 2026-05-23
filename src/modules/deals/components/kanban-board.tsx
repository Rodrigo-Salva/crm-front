'use client';

import { useState, useEffect } from 'react';
import { api } from '@/modules/shared/services/api';
import { Loading } from '@/modules/shared';
import { PipelineStage } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { io, Socket } from 'socket.io-client';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function KanbanBoard() {
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    
    // Configure WebSockets for real-time collaboration
    // Using process.env.NEXT_PUBLIC_API_URL without /api for the socket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const socket: Socket = io(socketUrl);

    socket.on('connect', () => {
      // Assuming a default tenantId for demonstration, in a real app this comes from AuthContext
      const tenantId = 'default-tenant-id'; 
      socket.emit('joinTenant', { tenantId });
    });

    socket.on('deal:updated', (data) => {
      // Invalidate query to refetch when another user moves a deal
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const { data, isLoading } = useQuery<{ stages: PipelineStage[] }>({
    queryKey: ['deals-pipeline'],
    queryFn: async () => {
      const res = await api.get<any>('/deals/pipeline');
      return res;
    },
  });

  const { mutate: updateStage } = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      await api.patch(`/deals/${dealId}/stage`, { stage });
    },
    onMutate: async ({ dealId, stage }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['deals-pipeline'] });
      const previousData = queryClient.getQueryData(['deals-pipeline']);

      queryClient.setQueryData(['deals-pipeline'], (old: any) => {
        if (!old) return old;
        
        let movedDeal: any = null;
        const newStages = old.stages.map((s: any) => {
          const dealIndex = s.deals.findIndex((d: any) => d.id === dealId);
          if (dealIndex > -1) {
            movedDeal = s.deals[dealIndex];
            return { ...s, deals: s.deals.filter((d: any) => d.id !== dealId) };
          }
          return s;
        });

        if (movedDeal) {
          const targetStageIndex = newStages.findIndex((s: any) => s.name === stage);
          if (targetStageIndex > -1) {
            newStages[targetStageIndex].deals.push(movedDeal);
          }
        }

        return { ...old, stages: newStages };
      });

      return { previousData };
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['deals-pipeline'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStageName = destination.droppableId;
    updateStage({ dealId: draggableId, stage: newStageName });
  };

  if (!mounted || isLoading) return <Loading />;
  
  const stages = data?.stages ?? [];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh] p-4 items-start">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-gray-50/80 rounded-lg border border-[var(--border)] flex flex-col"
          >
            <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color || 'var(--primary)' }} />
                <h3 className="font-semibold text-sm text-[var(--text)]">{stage.name}</h3>
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{stage.deals.length}</span>
              </div>
            </div>

            <Droppable droppableId={stage.name}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-3 space-y-3 flex-1 transition-colors min-h-[200px] ${
                    snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {stage.deals.map((deal: any, index: number) => (
                    <Draggable key={deal.id} draggableId={deal.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-lg border p-4 transition-all duration-150 ${
                            snapshot.isDragging
                              ? 'border-blue-400 shadow-lg scale-[1.02]'
                              : 'border-[var(--border)] hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-[var(--text)]">{deal.title}</h4>
                          <p className="text-sm font-bold text-[var(--text)] mt-1.5">{formatCurrency(deal.value)}</p>
                          {deal.contact && (
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-bold">
                                {deal.contact.name?.charAt(0) || '?'}
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] truncate">{deal.contact.name}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {stage.deals.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-[var(--border)]/50 rounded-lg">
                      <p className="text-xs text-[var(--text-muted)]">Arrastra aquí</p>
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
