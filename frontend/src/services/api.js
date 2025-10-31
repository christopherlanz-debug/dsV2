import axios from 'axios';

const API_BASE_URL = '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
  setup: (userData) => api.post('/auth/setup', userData),
  checkSetupStatus: () => api.get('/auth/setup/status'),
  getCurrentUser: () => api.get('/users/me')
};

// Screens API
export const screensAPI = {
  list: () => api.get('/screens'),
  get: (id) => api.get(`/screens/${id}`),
  create: (data) => api.post('/screens', data),
  update: (id, data) => api.put(`/screens/${id}`, data),
  delete: (id) => api.delete(`/screens/${id}`),
  getStatus: (id) => api.get(`/screens/${id}/status`)
};

// Content API
export const contentAPI = {
  list: () => api.get('/content'),
  get: (id) => api.get(`/content/${id}`),
  upload: (formData) => api.post('/content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  getItems: (id) => api.get(`/content/${id}/items`)
};

// Playlists API
export const playlistsAPI = {
  list: () => api.get('/playlists'),
  get: (id) => api.get(`/playlists/${id}`),
  getFull: (id) => api.get(`/playlists/${id}/full`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
  addItem: (playlistId, item) => api.post(`/playlists/${playlistId}/items`, item),
  removeItem: (playlistId, itemId) => api.delete(`/playlists/${playlistId}/items/${itemId}`),
  reorderItems: (playlistId, items) => api.put(`/playlists/${playlistId}/items/reorder`, items),
  // Schedule-Methoden
  createSchedule: (playlistId, data) => api.post(`/playlists/${playlistId}/schedules`, data),
  getSchedules: (playlistId) => api.get(`/playlists/${playlistId}/schedules`),
  updateSchedule: (playlistId, scheduleId, data) => api.put(`/playlists/${playlistId}/schedules/${scheduleId}`, data),
  deleteSchedule: (playlistId, scheduleId) => api.delete(`/playlists/${playlistId}/schedules/${scheduleId}`),
  getActiveSchedule: (playlistId) => api.get(`/playlists/${playlistId}/active-schedule`)
};

// WebSocket API - DIREKT ohne API_BASE_URL prefix!
const wsApi = axios.create({
  baseURL: '', // KEIN PREFIX!
  headers: {
    'Content-Type': 'application/json'
  }
});

wsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const websocketAPI = {
  getConnected: () => wsApi.get('/ws/connected'),
  reloadScreen: (screenName) => wsApi.post(`/ws/screen/${screenName}/reload`)
};

export default api;
