import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const debateAPI = {
  create: (data: any) => api.post('/debates', data),
  getAll: (params?: any) => api.get('/debates', { params }),
  getById: (id: string) => api.get(`/debates/${id}`),
  join: (id: string, side: 'A' | 'B') => api.post(`/debates/${id}/join`, { side }),
  judge: (id: string) => api.post(`/debates/${id}/judge`),

  // 🆕 NEW: fetch logged-in user's debate stats
  getUserStats: () => api.get('/debates/user-stats'),
};

export const argumentAPI = {
  create: (data: any) => api.post('/arguments', data),
  getByDebate: (debateId: string) => api.get(`/arguments/debate/${debateId}`),
};

export default api;
