import {
  Worker,
  EquipmentRequirement,
  Camera,
  VerificationAttempt,
  RestaurantSettings,
  DashboardStats,
  ReportsData,
  DetectionResult,
  VerificationEvaluationResponse
} from '@shared/types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('safekitchen_token');
  const tenantId = localStorage.getItem('safekitchen_tenant_id') || 'rest_demokitchen_001';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-restaurant-id': tenantId
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<{
      token: string;
      user: { id: string; email: string; name: string; role: string; restaurantId: string };
      restaurant: { id: string; name: string; slug: string; logoUrl?: string };
    }>(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse<{
      user: { id: string; email: string; name: string; role: string; restaurantId: string };
      restaurant: { id: string; name: string; slug: string; logoUrl?: string };
    }>(res);
  },

  // Workers
  getWorkers: async (search?: string, department?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    const res = await fetch(`${API_BASE}/workers?${params.toString()}`, { headers: getHeaders() });
    return handleResponse<{ workers: Worker[] }>(res);
  },

  getWorker: async (id: string) => {
    const res = await fetch(`${API_BASE}/workers/${id}`, { headers: getHeaders() });
    return handleResponse<{ worker: Worker; history: VerificationAttempt[] }>(res);
  },

  createWorker: async (data: { workerCode: string; firstName: string; lastName: string; department: string; avatarColor?: string }) => {
    const res = await fetch(`${API_BASE}/workers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; worker: Worker }>(res);
  },

  updateWorker: async (id: string, data: Partial<Worker>) => {
    const res = await fetch(`${API_BASE}/workers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteWorker: async (id: string) => {
    const res = await fetch(`${API_BASE}/workers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // Equipment Requirements
  getEquipment: async () => {
    const res = await fetch(`${API_BASE}/equipment`, { headers: getHeaders() });
    return handleResponse<{ equipment: EquipmentRequirement[] }>(res);
  },

  createEquipment: async (data: {
    name: string;
    description?: string;
    isRequired: boolean;
    isEnabled: boolean;
    minConfidence: number;
    icon?: string;
  }) => {
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; equipment: EquipmentRequirement }>(res);
  },

  updateEquipment: async (id: string, data: Partial<EquipmentRequirement>) => {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteEquipment: async (id: string) => {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // Cameras
  getCameras: async () => {
    const res = await fetch(`${API_BASE}/cameras`, { headers: getHeaders() });
    return handleResponse<{ cameras: Camera[] }>(res);
  },

  createCamera: async (data: { cameraCode: string; name: string; location: string; status?: string }) => {
    const res = await fetch(`${API_BASE}/cameras`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; camera: Camera }>(res);
  },

  updateCamera: async (id: string, data: Partial<Camera>) => {
    const res = await fetch(`${API_BASE}/cameras/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteCamera: async (id: string) => {
    const res = await fetch(`${API_BASE}/cameras/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // Verification
  submitVerification: async (data: {
    workerId: string;
    cameraId?: string;
    detection: DetectionResult;
    durationMs?: number;
  }) => {
    const res = await fetch(`${API_BASE}/verification`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<VerificationEvaluationResponse>(res);
  },

  getStats: async () => {
    const res = await fetch(`${API_BASE}/verification/stats`, { headers: getHeaders() });
    return handleResponse<DashboardStats>(res);
  },

  getHistory: async (result?: string, department?: string, search?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (result) params.append('result', result);
    if (department) params.append('department', department);
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    const res = await fetch(`${API_BASE}/verification/history?${params.toString()}`, { headers: getHeaders() });
    return handleResponse<{ history: VerificationAttempt[] }>(res);
  },

  getAttempt: async (id: string) => {
    const res = await fetch(`${API_BASE}/verification/attempt/${id}`, { headers: getHeaders() });
    return handleResponse<{ attempt: VerificationAttempt }>(res);
  },

  // Reports
  getReports: async (timeframe: 'today' | '7d' | '30d' | 'custom' = '7d', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ timeframe });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await fetch(`${API_BASE}/reports?${params.toString()}`, { headers: getHeaders() });
    return handleResponse<ReportsData>(res);
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return handleResponse<{ settings: RestaurantSettings }>(res);
  },

  updateSettings: async (data: Partial<RestaurantSettings>) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  }
};
