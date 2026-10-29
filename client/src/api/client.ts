/**
 * Resolves the backend API base URL:
 * 1. Reads import.meta.env.VITE_API_BASE_URL or import.meta.env.VITE_API_URL
 * 2. Normalizes whitespace and trailing slashes
 * 3. Appends /api if given a root backend domain (e.g. https://backend.onrender.com -> https://backend.onrender.com/api)
 * 4. Defaults to '/api' for local development with Vite dev server proxy
 */
export function resolveApiBase(): string {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ''
  ).trim();

  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    if ((cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) && !cleanUrl.endsWith('/api')) {
      return `${cleanUrl}/api`;
    }
    return cleanUrl;
  }

  // Helpful console guidance if running on deployed frontend without backend URL
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      console.warn(
        '[TravelWise AI+] Notice: VITE_API_BASE_URL is not set. ' +
        'API calls are falling back to relative "/api". ' +
        'In your Vercel project settings, add VITE_API_BASE_URL=https://<your-render-backend-url>/api and trigger a redeploy.'
      );
    }
  }

  return '/api';
}

export const API_BASE = resolveApiBase();

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('travelwise_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only add application/json Content-Type if not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${cleanEndpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to TravelWise AI+ server. Please check your internet connection or verify the backend service is running.',
      0,
      err
    );
  }

  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (response.status === 404) {
        errorMsg = 'API endpoint not found (404). Please ensure the backend server is deployed and VITE_API_BASE_URL is set in Vercel project environment variables.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export async function downloadBlob(endpoint: string, filename: string): Promise<void> {
  const token = localStorage.getItem('travelwise_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, { headers });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getAuthenticatedBlobUrl(endpoint: string): Promise<string> {
  const token = localStorage.getItem('travelwise_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, { headers });
  if (!response.ok) {
    throw new Error('File not accessible');
  }
  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }).catch(() => {}),
  getCurrentUser: () => request<any>('/auth/me'),
  updateProfile: (payload: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: any) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAccount: (confirmation: string) => request<any>('/auth/delete-account', { method: 'DELETE', body: JSON.stringify({ confirmation }) }),

  // Trips
  getTrips: () => request<{ trips: any[] }>('/trips'),
  getTrip: (id: number) => request<{ trip: any }>(`/trips/${id}`),
  createTrip: (payload: any) => request<{ message: string; trip_id: number }>('/trips', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrip: (id: number, payload: any) => request<any>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (id: number) => request<any>(`/trips/${id}`, { method: 'DELETE' }),
  getTripWeather: (tripId: number) => request<{ destination: string; weather: any }>(`/trips/${tripId}/weather`),

  // Itinerary
  updateActivity: (id: number, payload: any) => request<any>(`/itineraries/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteActivity: (id: number) => request<any>(`/itineraries/activities/${id}`, { method: 'DELETE' }),
  replaceActivity: (id: number, payload: any) => request<any>(`/itineraries/activities/${id}/replace`, { method: 'POST', body: JSON.stringify(payload) }),
  addActivity: (dayId: number, payload: any) => request<any>(`/itineraries/days/${dayId}/activities`, { method: 'POST', body: JSON.stringify(payload) }),

  // Expenses & Budget Guardian 2.0
  getTripExpenses: (tripId: number) => request<{ expenses: any[]; summary: any }>(`/expenses/trips/${tripId}`),
  addExpense: (tripId: number, payload: any) => request<any>(`/expenses/trips/${tripId}`, { method: 'POST', body: JSON.stringify(payload) }),
  updateExpense: (id: number, payload: any) => request<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteExpense: (id: number) => request<any>(`/expenses/${id}`, { method: 'DELETE' }),
  uploadReceipt: (tripId: number, data: any) => request<any>(`/expenses/trips/${tripId}/receipt-mock-upload`, { method: 'POST', body: JSON.stringify(data) }),

  // Receipts Vault
  uploadReceiptScan: (formData: FormData) => request<any>('/receipts/upload-scan', { method: 'POST', body: formData }),
  createReceipt: (payload: any) => request<any>('/receipts', { method: 'POST', body: JSON.stringify(payload) }),
  getReceipts: (params?: { trip_id?: number; category?: string; start_date?: string; end_date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.trip_id) q.set('trip_id', String(params.trip_id));
    if (params?.category) q.set('category', params.category);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<{ receipts: any[]; summary: any }>(`/receipts${qs ? `?${qs}` : ''}`);
  },
  getReceipt: (id: number) => request<{ receipt: any }>(`/receipts/${id}`),
  updateReceipt: (id: number, payload: any) => request<any>(`/receipts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReceipt: (id: number, deleteLinkedExpense?: boolean) =>
    request<any>(`/receipts/${id}${deleteLinkedExpense ? '?delete_linked_expense=1' : ''}`, { method: 'DELETE' }),
  convertReceiptToExpense: (id: number, payload: { trip_id?: number; category?: string; amount?: number; title?: string }) =>
    request<any>(`/receipts/${id}/convert-to-expense`, { method: 'POST', body: JSON.stringify(payload) }),
  downloadReceiptFile: (id: number, filename: string) => downloadBlob(`/receipts/${id}/file?download=1`, filename),
  getReceiptFileBlobUrl: (id: number) => getAuthenticatedBlobUrl(`/receipts/${id}/file`),
  exportReceiptsCsv: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return downloadBlob(`/receipts/export${q ? `?${q}` : ''}`, `TravelWise_Receipts_${Date.now()}.csv`);
  },

  // Adaptive Intelligence 2.0
  evaluateAdaptation: (tripId: number, payload: any) => request<any>(`/adaptive/trips/${tripId}/evaluate`, { method: 'POST', body: JSON.stringify(payload) }),
  applyAdaptation: (tripId: number, changes: any[], scenario?: string) => request<any>(`/adaptive/trips/${tripId}/apply`, { method: 'POST', body: JSON.stringify({ changes, scenario }) }),
  getTripRevisions: (tripId: number) => request<{ revisions: any[] }>(`/adaptive/trips/${tripId}/revisions`),
  undoRevision: (tripId: number, revisionId: number) => request<any>(`/adaptive/trips/${tripId}/revisions/${revisionId}/undo`, { method: 'POST' }),

  // Chatbot 2.0
  getChatHistory: (tripId: number) => request<{ messages: any[] }>(`/chatbot/trips/${tripId}/messages`),
  askChatbot: (tripId: number, message: string) => request<any>(`/chatbot/trips/${tripId}/ask`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Group Expenses 2.0
  getGroupMembers: (tripId: number) => request<{ members: any[] }>(`/group/trips/${tripId}/members`),
  addGroupMember: (tripId: number, payload: { name: string; email?: string }) => request<any>(`/group/trips/${tripId}/members`, { method: 'POST', body: JSON.stringify(payload) }),
  removeGroupMember: (tripId: number, memberId: number) => request<any>(`/group/trips/${tripId}/members/${memberId}`, { method: 'DELETE' }),
  getGroupSplitSummary: (tripId: number) => request<any>(`/group/trips/${tripId}/split-summary`),

  // Destinations Catalog
  getDestinations: () => request<{ destinations: any[]; regional_sub_destinations: Record<string, any[]> }>('/destinations'),
  resolveDestination: (query: string) => request<any>('/destinations/resolve?q=' + encodeURIComponent(query)),

  // Travel Helper
  getHelperResources: () => request<any>('/helper/resources'),
  submitSupportTicket: (payload: any) => request<any>('/helper/support-tickets', { method: 'POST', body: JSON.stringify(payload) }),
  getMyTickets: () => request<{ tickets: any[] }>('/helper/my-tickets'),
};
