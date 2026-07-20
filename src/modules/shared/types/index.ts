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

export enum ContactStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
}

export type Currency = 'MXN' | 'USD' | 'EUR' | 'CAD' | 'GBP' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'BRL';

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
  ruc?: string;
  ownerId: string;
  customFields?: Record<string, any>;
  _count?: { leads: number };
  leads?: { id: string; name: string; email?: string; status?: string }[];
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
  clickedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  _count?: { recipients: number };
  recipients?: CampaignRecipient[];
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  leadId: string;
  email: string;
  sent: boolean;
  opened: boolean;
  openedAt?: string;
  error?: string;
  lead?: { id: string; name: string; email: string };
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  unit: string;
  categoryId?: string;
  category?: { id: string; name: string };
  sku?: string;
  type?: 'physical' | 'digital' | 'service';
  billingType?: 'one_time' | 'recurring';
  stock?: number;
  trackStock?: boolean;
  active: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  leadId?: string;
  tenantId: string;
  ownerId: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  lead?: { id: string; name: string };
  owner?: { id: string; name: string };
}

export interface Quote {
  id: string;
  number: string;
  leadId?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';
  currency: Currency;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  requiresSignature?: boolean;
  signatureDate?: string;
  notes?: string;
  version: number;
  discountPercent?: number;
  lead?: { id: string; name: string; email?: string; companyName?: string };
  items: QuoteLineItem[];
  approvalRequest?: { id: string; status: string };
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  productId?: string;
  description: string;
  section?: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  discountPercent: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  subscriptionId: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: Currency;
  amount: number;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  contractId: string;
  billingInterval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: Currency;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  nextBillingDate: string;
  lastBilledAt?: string;
  cancelledAt?: string;
  invoices?: Invoice[];
}

export interface Contract {
  id: string;
  number: string;
  quoteId: string;
  leadId: string;
  status: 'draft' | 'sent' | 'accepted' | 'active' | 'cancelled' | 'expired';
  content: string;
  documentHash?: string;
  acceptedByUserId?: string;
  acceptedIp?: string;
  acceptedAt?: string;
  sentAt?: string;
  lead?: { id: string; name: string; email?: string; companyName?: string };
  quote?: { id: string; number: string; grandTotal: number; currency: Currency };
  subscription?: Subscription;
  createdAt: string;
}

export interface PlaybookStep {
  id: string;
  playbookId: string;
  title: string;
  description?: string;
  dayOffset: number;
  order: number;
}

export interface Playbook {
  id: string;
  name: string;
  trigger: 'contract_accepted' | 'renewal_upcoming';
  active: boolean;
  steps: PlaybookStep[];
  createdAt: string;
}

export interface PlaybookRunTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface PlaybookRun {
  id: string;
  playbookId: string;
  leadId: string;
  contractId?: string;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  playbook: { id: string; name: string; trigger: string };
  tasks: PlaybookRunTask[];
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  leadId?: string;
  assignedTo?: string;
  slaDeadline?: string;
  firstResponseDeadline?: string;
  firstRespondedAt?: string;
  customFields?: Record<string, any>;
  lead?: { id: string; name: string; email: string };
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
  healthScore?: number | null;
  healthStatus?: 'healthy' | 'at_risk' | 'critical' | 'unknown';
  notes?: string;
  value: number;
  currency: Currency;
  expectedCloseDate?: string;
  customFields?: Record<string, any>;
  companyId?: string;
  companyName?: string;
  position?: string;
  customerStatus?: ContactStatus;
  account?: { id: string; name: string };
  campaignId?: string;
  campaign?: { id: string; name: string; channel?: string };
  careerId?: string;
  career?: { id: string; name: string };
  modalityId?: string;
  modality?: { id: string; name: string };
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  subPhaseId?: string;
  subPhase?: { id: string; name: string };
  referredByLeadId?: string;
  referredByLead?: { id: string; name: string };
  isPartner?: boolean;
  ownerId: string;
  tenantId: string;
  owner?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { leads: number };
}
