export const EVENTS = [
  { value: 'lead.created', label: 'Lead creado' },
  { value: 'lead.updated', label: 'Lead actualizado' },
  { value: 'lead.stage_changed', label: 'Etapa de lead cambiada' },
  { value: 'ticket.created', label: 'Ticket creado' },
  { value: 'ticket.updated', label: 'Ticket actualizado' },
  { value: 'task.created', label: 'Tarea creada' },
  { value: 'task.updated', label: 'Tarea actualizada' },
];

export const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contiene' },
];

export const ACTION_TYPES = [
  { value: 'assign_round_robin', label: 'Asignación round robin' },
  { value: 'assign_workload', label: 'Asignar por carga de trabajo' },
  { value: 'create_task', label: 'Crear tarea' },
  { value: 'change_stage', label: 'Cambiar etapa' },
  { value: 'notify', label: 'Notificar' },
];

export const CONDITION_FIELDS = [
  { value: '', label: 'Seleccionar campo...' },
  { value: 'source', label: 'Origen' },
  { value: 'careerId', label: 'Carrera' },
  { value: 'modalityId', label: 'Modalidad' },
  { value: 'status', label: 'Etapa' },
  { value: 'value', label: 'Valor Estimado' },
  { value: 'utmSource', label: 'UTM Source' },
  { value: 'utmMedium', label: 'UTM Medium' },
  { value: 'utmCampaign', label: 'UTM Campaign' },
];

export interface Condition {
  field: string;
  operator: string;
  value: string;
}

export interface AutomationNode {
  id: string;
  automationId: string;
  type: 'trigger' | 'action' | 'wait' | 'condition';
  actionType?: string | null;
  config: Record<string, any> | null;
  positionX: number;
  positionY: number;
}

export interface AutomationConnection {
  id: string;
  automationId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
}

export interface Automation {
  id: string;
  name: string;
  active: boolean;
  nodes: AutomationNode[];
  connections: AutomationConnection[];
  createdAt: string;
}
