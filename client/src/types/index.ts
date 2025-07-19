export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: string;
  assignedTo?: number;
  notes?: string;
  investmentAmount?: string;
  bondType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  leadId?: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  panNumber?: string;
  kycStatus: string;
  dematAccount?: string;
  totalInvestment?: string;
  relationshipManager?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQ {
  id: number;
  rfqNumber: string;
  customerId?: number;
  bondType: string;
  bondName: string;
  faceValue: string;
  quantity: number;
  bidPrice?: string;
  askPrice?: string;
  status: string;
  nseRfqId?: string;
  submittedBy?: number;
  submittedAt?: string;
  executedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: number;
  ticketNumber: string;
  customerId?: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: number;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIs {
  activeLeads: number;
  activeCustomers: number;
  totalInvestment: string;
  pendingRFQs: number;
}

export interface LeadSource {
  source: string;
  count: number;
}

export interface SalesPerformance {
  period: string;
  amount: string;
}

export interface Activity {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: any;
  createdAt: string;
  userName?: string;
}
