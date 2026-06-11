import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor: attach Bearer token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sm_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('sm_token')
      localStorage.removeItem('sm_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  updateApiKeys: (data) => api.put('/api/auth/api-keys', data),
  updateNotifications: (data) => api.put('/api/auth/notifications', data),
  deleteAccount: () => api.delete('/api/auth/me'),
}

// ── Brands ──
export const brandsAPI = {
  create: (data) => api.post('/api/brands', data),
  list: () => api.get('/api/brands'),
  get: (id) => api.get(`/api/brands/${id}`),
  update: (id, data) => api.put(`/api/brands/${id}`, data),
  delete: (id) => api.delete(`/api/brands/${id}`),
  uploadDoc: (brandId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/brands/${brandId}/upload-doc`, form)
  },
}

// ── Content ──
export const contentAPI = {
  generate: (data) => api.post('/api/content/generate', data),
  list: (params) => api.get('/api/content', { params }),
  get: (id) => api.get(`/api/content/${id}`),
  update: (id, data) => api.put(`/api/content/${id}`, data),
  delete: (id) => api.delete(`/api/content/${id}`),
}

// ── Scheduler ──
export const schedulerAPI = {
  schedule: (data) => api.post('/api/scheduler', data),
  list: (params) => api.get('/api/scheduler', { params }),
  update: (id, data) => api.put(`/api/scheduler/${id}`, data),
  cancel: (id) => api.delete(`/api/scheduler/${id}`),
}

// ── Analytics ──
export const analyticsAPI = {
  get: (params) => api.get('/api/analytics', { params }),
}

// ── Competitors ──
export const competitorsAPI = {
  analyze: (data) => api.post('/api/competitors', data),
  list: () => api.get('/api/competitors'),
  get: (id) => api.get(`/api/competitors/${id}`),
  delete: (id) => api.delete(`/api/competitors/${id}`),
}

export default api
