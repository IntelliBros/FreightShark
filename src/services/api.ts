import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  validate: async () => {
    const response = await api.get('/auth/validate');
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Quote endpoints
export const quoteAPI = {
  // Quote requests
  getRequests: async () => {
    const response = await api.get('/quotes/requests');
    return response.data;
  },
  
  getMyRequests: async () => {
    const response = await api.get('/quotes/requests/my');
    return response.data;
  },
  
  getRequest: async (id: string) => {
    const response = await api.get(`/quotes/requests/${id}`);
    return response.data;
  },
  
  createRequest: async (requestData: any) => {
    const response = await api.post('/quotes/requests', requestData);
    return response.data;
  },
  
  updateRequestStatus: async (id: string, status: string) => {
    const response = await api.patch(`/quotes/requests/${id}/status`, { status });
    return response.data;
  },
  
  // Quotes
  getAll: async () => {
    const response = await api.get('/quotes');
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  },
  
  create: async (quoteData: any) => {
    const response = await api.post('/quotes', quoteData);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/quotes/${id}/status`, { status });
    return response.data;
  },
  
  accept: async (id: string) => {
    const response = await api.post(`/quotes/${id}/accept`);
    return response.data;
  },
};

// Shipment endpoints
export const shipmentAPI = {
  getAll: async () => {
    const response = await api.get('/shipments');
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, location?: string, description?: string) => {
    const response = await api.patch(`/shipments/${id}/status`, {
      status,
      location,
      description,
    });
    return response.data;
  },
  
  updateWeights: async (id: string, actualWeight: number) => {
    const response = await api.patch(`/shipments/${id}/weights`, { actualWeight });
    return response.data;
  },
  
  addTracking: async (id: string, trackingData: any) => {
    const response = await api.post(`/shipments/${id}/tracking`, trackingData);
    return response.data;
  },
  
  uploadDocument: async (id: string, documentData: any) => {
    const response = await api.post(`/shipments/${id}/documents`, documentData);
    return response.data;
  },
  
  getDocuments: async (id: string) => {
    const response = await api.get(`/shipments/${id}/documents`);
    return response.data;
  },
  
  deleteDocument: async (shipmentId: string, documentId: string) => {
    const response = await api.delete(`/shipments/${shipmentId}/documents/${documentId}`);
    return response.data;
  },
};

// User endpoints
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: any) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },
  
  updateRole: async (id: string, role: string) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },
};

// Announcement endpoints
export const announcementAPI = {
  getActive: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/announcements/all');
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },
  
  create: async (announcementData: any) => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },
  
  update: async (id: string, announcementData: any) => {
    const response = await api.patch(`/announcements/${id}`, announcementData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};

export default api;