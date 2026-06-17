const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// Types
export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget?: number;
  onboarding_status: string;
  documents: Array<{ name: string; type: string; uploaded_at: string }>;
  onboarding_steps: Array<{ step: string; status: string; order: number }>;
  created_at: string;
}

export interface Proposal {
  id: string;
  client_id?: string;
  title: string;
  content?: string;
  budget?: number;
  timeline?: string;
  services: string[];
  status: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  client_id?: string;
  type: string;
  title: string;
  content?: string;
  status: string;
  version: number;
  created_at: string;
}

export interface SEOReport {
  id: string;
  client_id?: string;
  keyword_rankings: Record<string, { position: number; change: string }>;
  traffic_data: Record<string, string | number>;
  competitor_data: { competitors?: Array<{ name: string; domain_authority: number; organic_traffic: number }> };
  report_date: string;
}

export interface Task {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: string;
  status: string;
  due_date?: string;
  created_at: string;
}

export interface Communication {
  id: string;
  client_id?: string;
  message_type: string;
  content: string;
  timestamp: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  client_id?: string;
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  total_amount: number;
  payment_status: string;
  due_date?: string;
  created_at: string;
}

export interface DashboardStats {
  active_clients: number;
  pending_tasks: number;
  revenue_this_month: number;
  pending_invoices: number;
}

// API methods
export const api = {
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  getClients: () => request<Client[]>('/clients'),
  getClient: (id: string) => request<Client>(`/clients/${id}`),
  createClient: (data: Partial<Client>) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getProposals: () => request<Proposal[]>('/proposals'),
  getProposal: (id: string) => request<Proposal>(`/proposals/${id}`),
  createProposal: (data: Partial<Proposal>) =>
    request<Proposal>('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  generateProposal: (data: {
    client_name: string;
    company?: string;
    budget: number;
    timeline: string;
    services: string[];
    notes?: string;
    client_id?: string;
    title?: string;
  }) => request<Proposal>('/proposals/generate', { method: 'POST', body: JSON.stringify(data) }),

  getContent: () => request<ContentItem[]>('/content'),
  createContent: (data: Partial<ContentItem>) =>
    request<ContentItem>('/content', { method: 'POST', body: JSON.stringify(data) }),
  generateContent: (data: { type: string; topic: string; title?: string; client_id?: string; client_name?: string }) =>
    request<ContentItem>('/content/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateContentStatus: (id: string, status: string) =>
    request<ContentItem>(`/content/${id}/status?status=${status}`, { method: 'PUT' }),

  getSEOReports: () => request<SEOReport[]>('/seo-reports'),
  analyzeSEO: (data: { client_id: string; domain: string; keywords: string[] }) =>
    request<SEOReport>('/seo/analyze', { method: 'POST', body: JSON.stringify(data) }),

  getTasks: () => request<Task[]>('/tasks'),
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  getCommunications: (clientId?: string) =>
    request<Communication[]>(clientId ? `/communications?client_id=${clientId}` : '/communications'),
  addCommunication: (data: { client_id: string; message_type: string; content: string; notes?: string }) =>
    request<Communication>('/communications', { method: 'POST', body: JSON.stringify(data) }),

  getInvoices: () => request<Invoice[]>('/invoices'),
  createInvoice: (data: {
    client_id: string;
    items: Array<{ description: string; quantity: number; unit_price: number }>;
    due_date?: string;
    payment_status?: string;
  }) => request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, payment_status: string) =>
    request<Invoice>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify({ payment_status }) }),
};

export { ApiError };
