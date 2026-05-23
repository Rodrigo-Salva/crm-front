export type UserRole = 'superadmin' | 'admin' | 'seller' | 'reader';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  position?: string;
  status: ContactStatus;
  companyId?: string;
  ownerId: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum ContactStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
}

export type Currency = 'MXN' | 'USD' | 'EUR' | 'CAD' | 'GBP' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'BRL';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: Currency;
  stage: DealStage;
  contactId: string;
  contact?: { id: string; name: string; email: string };
  ownerId: string;
  customFields?: Record<string, any>;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum DealStage {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId: string;
  relatedTo?: { type: string; id: string };
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  ownerId: string;
  customFields?: Record<string, any>;
  _count?: { contacts: number };
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  relatedTo: { type: string; id: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'sent' | 'cancelled';
  templateId?: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  _count?: { recipients: number };
  recipients?: CampaignRecipient[];
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  sent: boolean;
  opened: boolean;
  openedAt?: string;
  error?: string;
  contact?: { id: string; name: string; email: string };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  unit: string;
  category?: string;
  sku?: string;
  active: boolean;
}

export interface Quote {
  id: string;
  number: string;
  dealId?: string;
  contactId?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';
  currency: Currency;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  version: number;
  discountPercent?: number;
  contact?: { id: string; name: string; email: string };
  deal?: { id: string; title: string };
  items: QuoteLineItem[];
  approvalRequest?: { id: string; status: string };
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  discountPercent: number;
  total: number;
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  contactId?: string;
  assignedTo?: string;
  slaDeadline?: string;
  customFields?: Record<string, any>;
  contact?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string };
  messages?: TicketMessage[];
  _count?: { messages: number };
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId?: string;
  content: string;
  isInternal: boolean;
  author?: { id: string; name: string };
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  status: string;
  score: number;
  notes?: string;
  ownerId: string;
  tenantId: string;
  convertedContactId?: string;
  convertedDealId?: string;
  owner?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
