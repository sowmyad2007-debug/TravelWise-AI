import {
  localRegister,
  localLogin,
  getCurrentUserLocal,
  localUpdateProfile,
  localGetTrips,
  localGetTrip,
  localCreateTrip,
  localUpdateTrip,
  localDeleteTrip,
  localGetTripWeather,
  localUpdateActivity,
  localDeleteActivity,
  localReplaceActivity,
  localAddActivity,
  localGetTripExpenses,
  localAddExpense,
  localDeleteExpense,
  localGetReceipts,
  localCreateReceipt,
  localGetReceipt,
  localUpdateReceipt,
  localDeleteReceipt,
  localConvertReceiptToExpense,
  localGetReceiptFileBlobUrl,
  localUploadReceiptScan,
  localGetDestinations,
  localResolveDestination,
  localEvaluateAdaptation,
  localAskChatbot,
  localGetGroupMembers,
  localAddGroupMember,
  localRemoveGroupMember,
  localGetGroupSplitSummary,
  localGetHelperResources,
  localSubmitSupportTicket,
  localGetMyTickets
} from './localStore';

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

export function shouldBypassNetwork(): boolean {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If running in production (e.g. deployed on Vercel) and API_BASE is relative '/api' (no external backend URL configured),
    // Vercel only hosts static files and has no backend handler for /api, so execute through local store directly
    if (!isLocalhost && !API_BASE.startsWith('http://') && !API_BASE.startsWith('https://')) {
      return true;
    }
  }
  return false;
}

export async function requestWithFallback<T>(
  endpoint: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  // If deployed without a remote backend URL, immediately execute through resilient local store
  if (shouldBypassNetwork()) {
    return await fallbackFn();
  }

  try {
    return await request<T>(endpoint, options);
  } catch (err: any) {
    // If backend returns 404, 405 (Method Not Allowed on static hosts), 500, 502, 503, 504, 0 or network failure
    if (
      err.status === 404 ||
      err.status === 405 ||
      err.status === 0 ||
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.message?.includes('connect') ||
      err.message?.includes('fetch')
    ) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload: any) =>
    requestWithFallback<any>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) },
      () => localRegister(payload)
    ),
  signup: (payload: any) =>
    requestWithFallback<any>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify(payload) },
      () => localRegister(payload)
    ),
  login: (payload: any) =>
    requestWithFallback<any>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(payload) },
      () => localLogin(payload)
    ),
  logout: () => {
    localStorage.removeItem('travelwise_current_user');
    return request<any>('/auth/logout', { method: 'POST' }).catch(() => {});
  },
  getCurrentUser: () =>
    requestWithFallback<any>(
      '/auth/me',
      {},
      () => {
        const u = getCurrentUserLocal();
        if (!u) throw new ApiError('Session expired. Please log in again.', 401);
        return { user: u };
      }
    ),
  updateProfile: (payload: any) =>
    requestWithFallback<any>(
      '/auth/profile',
      { method: 'PUT', body: JSON.stringify(payload) },
      () => localUpdateProfile(payload)
    ),
  changePassword: (payload: any) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: any) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAccount: (confirmation: string) => request<any>('/auth/delete-account', { method: 'DELETE', body: JSON.stringify({ confirmation }) }),

  // Trips
  getTrips: () =>
    requestWithFallback<{ trips: any[] }>(
      '/trips',
      {},
      () => localGetTrips()
    ),
  getTrip: (id: number) =>
    requestWithFallback<{ trip: any }>(
      `/trips/${id}`,
      {},
      () => localGetTrip(id)
    ),
  createTrip: (payload: any) =>
    requestWithFallback<{ message: string; trip_id: number }>(
      '/trips',
      { method: 'POST', body: JSON.stringify(payload) },
      () => localCreateTrip(payload)
    ),
  updateTrip: (id: number, payload: any) =>
    requestWithFallback<any>(
      `/trips/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      () => localUpdateTrip(id, payload)
    ),
  deleteTrip: (id: number) =>
    requestWithFallback<any>(
      `/trips/${id}`,
      { method: 'DELETE' },
      () => localDeleteTrip(id)
    ),
  getTripWeather: (tripId: number) =>
    requestWithFallback<{ destination: string; weather: any }>(
      `/trips/${tripId}/weather`,
      {},
      () => localGetTripWeather(tripId)
    ),

  // Itinerary
  updateActivity: (id: number, payload: any) =>
    requestWithFallback<any>(
      `/itineraries/activities/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      () => localUpdateActivity(id, payload)
    ),
  deleteActivity: (id: number) =>
    requestWithFallback<any>(
      `/itineraries/activities/${id}`,
      { method: 'DELETE' },
      () => localDeleteActivity(id)
    ),
  replaceActivity: (id: number, payload: any) =>
    requestWithFallback<any>(
      `/itineraries/activities/${id}/replace`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localReplaceActivity(id, payload)
    ),
  addActivity: (dayId: number, payload: any) =>
    requestWithFallback<any>(
      `/itineraries/days/${dayId}/activities`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localAddActivity(dayId, payload)
    ),

  // Expenses & Budget Guardian 2.0
  getTripExpenses: (tripId: number) =>
    requestWithFallback<{ expenses: any[]; summary: any }>(
      `/expenses/trips/${tripId}`,
      {},
      () => localGetTripExpenses(tripId)
    ),
  addExpense: (tripId: number, payload: any) =>
    requestWithFallback<any>(
      `/expenses/trips/${tripId}`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localAddExpense(tripId, payload)
    ),
  updateExpense: (id: number, payload: any) => request<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteExpense: (id: number) =>
    requestWithFallback<any>(
      `/expenses/${id}`,
      { method: 'DELETE' },
      () => localDeleteExpense(id)
    ),
  uploadReceipt: (tripId: number, data: any) => request<any>(`/expenses/trips/${tripId}/receipt-mock-upload`, { method: 'POST', body: JSON.stringify(data) }),

  // Receipts Vault
  uploadReceiptScan: (formData: FormData) =>
    requestWithFallback<any>(
      '/receipts/upload-scan',
      { method: 'POST', body: formData },
      () => localUploadReceiptScan(formData)
    ),
  createReceipt: (payload: any) =>
    requestWithFallback<any>(
      '/receipts',
      {
        method: 'POST',
        body: payload instanceof FormData ? payload : JSON.stringify(payload)
      },
      () => localCreateReceipt(payload)
    ),
  getReceipts: (params?: { trip_id?: number; category?: string; start_date?: string; end_date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.trip_id) q.set('trip_id', String(params.trip_id));
    if (params?.category) q.set('category', params.category);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return requestWithFallback<{ receipts: any[]; summary: any }>(
      `/receipts${qs ? `?${qs}` : ''}`,
      {},
      () => localGetReceipts(params)
    );
  },
  getReceipt: (id: number) =>
    requestWithFallback<{ receipt: any }>(
      `/receipts/${id}`,
      {},
      () => localGetReceipt(id)
    ),
  updateReceipt: (id: number, payload: any) =>
    requestWithFallback<any>(
      `/receipts/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      () => localUpdateReceipt(id, payload)
    ),
  deleteReceipt: (id: number, deleteLinkedExpense?: boolean) =>
    requestWithFallback<any>(
      `/receipts/${id}${deleteLinkedExpense ? '?delete_linked_expense=1' : ''}`,
      { method: 'DELETE' },
      () => localDeleteReceipt(id, deleteLinkedExpense)
    ),
  convertReceiptToExpense: (id: number, payload: { trip_id?: number; category?: string; amount?: number; title?: string }) =>
    requestWithFallback<any>(
      `/receipts/${id}/convert-to-expense`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localConvertReceiptToExpense(id, payload)
    ),
  downloadReceiptFile: (id: number, filename: string) => downloadBlob(`/receipts/${id}/file?download=1`, filename),
  getReceiptFileBlobUrl: (id: number) =>
    getAuthenticatedBlobUrl(`/receipts/${id}/file`).catch(() => localGetReceiptFileBlobUrl(id)),
  exportReceiptsCsv: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return downloadBlob(`/receipts/export${q ? `?${q}` : ''}`, `TravelWise_Receipts_${Date.now()}.csv`);
  },

  // Adaptive Intelligence 2.0
  evaluateAdaptation: (tripId: number, payload: any) =>
    requestWithFallback<any>(
      `/adaptive/trips/${tripId}/evaluate`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localEvaluateAdaptation(tripId, payload)
    ),
  applyAdaptation: (tripId: number, changes: any[], scenario?: string) => request<any>(`/adaptive/trips/${tripId}/apply`, { method: 'POST', body: JSON.stringify({ changes, scenario }) }),
  getTripRevisions: (tripId: number) => request<{ revisions: any[] }>(`/adaptive/trips/${tripId}/revisions`).catch(() => ({ revisions: [] })),
  undoRevision: (tripId: number, revisionId: number) => request<any>(`/adaptive/trips/${tripId}/revisions/${revisionId}/undo`, { method: 'POST' }),

  // Chatbot 2.0
  getChatHistory: (tripId: number) => request<{ messages: any[] }>(`/chatbot/trips/${tripId}/messages`).catch(() => ({ messages: [] })),
  askChatbot: (tripId: number, message: string) =>
    requestWithFallback<any>(
      `/chatbot/trips/${tripId}/ask`,
      { method: 'POST', body: JSON.stringify({ message }) },
      () => localAskChatbot(tripId, message)
    ),

  // Group Expenses 2.0
  getGroupMembers: (tripId: number) =>
    requestWithFallback<{ members: any[] }>(
      `/group/trips/${tripId}/members`,
      {},
      () => localGetGroupMembers(tripId)
    ),
  addGroupMember: (tripId: number, payload: { name: string; email?: string }) =>
    requestWithFallback<any>(
      `/group/trips/${tripId}/members`,
      { method: 'POST', body: JSON.stringify(payload) },
      () => localAddGroupMember(tripId, payload)
    ),
  removeGroupMember: (tripId: number, memberId: number) =>
    requestWithFallback<any>(
      `/group/trips/${tripId}/members/${memberId}`,
      { method: 'DELETE' },
      () => localRemoveGroupMember(tripId, memberId)
    ),
  getGroupSplitSummary: (tripId: number) =>
    requestWithFallback<any>(
      `/group/trips/${tripId}/split-summary`,
      {},
      () => localGetGroupSplitSummary(tripId)
    ),

  // Destinations Catalog
  getDestinations: () =>
    requestWithFallback<{ destinations: any[]; regional_sub_destinations: Record<string, any[]> }>(
      '/destinations',
      {},
      () => localGetDestinations()
    ),
  resolveDestination: (query: string) =>
    requestWithFallback<any>(
      '/destinations/resolve?q=' + encodeURIComponent(query),
      {},
      () => localResolveDestination(query)
    ),

  // Travel Helper
  getHelperResources: () =>
    requestWithFallback<any>(
      '/helper/resources',
      {},
      () => localGetHelperResources()
    ),
  submitSupportTicket: (payload: any) =>
    requestWithFallback<any>(
      '/helper/support-tickets',
      { method: 'POST', body: JSON.stringify(payload) },
      () => localSubmitSupportTicket(payload)
    ),
  getMyTickets: () =>
    requestWithFallback<{ tickets: any[] }>(
      '/helper/my-tickets',
      {},
      () => localGetMyTickets()
    ),
};
