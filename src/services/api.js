import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';

const API_URL = 'http://35.208.248.206:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authAPI = {
  login: (login, password) =>
    api.post('/auth/login', { login, password }).then((r) => r.data),

  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),

  verify: (token) =>
    api.post('/auth/verify', {}, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),
};

// Chat
export const chatAPI = {
  sendMessage: (message, employeeId) =>
    api.post('/chat/message', { message, employeeId }).then((r) => r.data),

  // SSE streaming — calls onChunk({ type, delta?, source? }) per event, onDone() on finish
  sendMessageStream: async (message, employeeId, onChunk, onDone, onError) => {
    const token = await getToken();
    const url = `${API_URL}/chat/stream`;

    const es = new EventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, employeeId }),
    });

    es.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'done') {
          es.close();
          onDone?.();
        } else {
          onChunk(data);
        }
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener('error', (err) => {
      es.close();
      onError?.(err);
    });

    return () => es.close();
  },

  getHistory: (employeeId) =>
    api.get(`/chat/history/${employeeId}`).then((r) => r.data),
};

// Employee
export const employeeAPI = {
  getEmployee: (employeeId) =>
    api.get(`/employee/${employeeId}`).then((r) => r.data),

  getVacation: (employeeId) =>
    api.get(`/employee/${employeeId}/vacation`).then((r) => r.data),

  getBirthday: (employeeId) =>
    api.get(`/employee/${employeeId}/birthday`).then((r) => r.data),

  auth: (employeeId, email) =>
    api.post('/employee/auth', { employeeId, email }).then((r) => r.data),

  searchByName: (name) =>
    api.get(`/employee/search/by-name?name=${encodeURIComponent(name)}`).then((r) => r.data),
};

// Documents
export const documentsAPI = {
  getDocuments: (category = null, type = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    const q = params.toString();
    return api.get(q ? `/documents?${q}` : '/documents').then((r) => r.data);
  },

  getDocument: (documentId) =>
    api.get(`/documents/${documentId}`).then((r) => r.data),

  uploadDocument: (file, title, category, type) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('category', category);
    form.append('type', type);
    return api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteDocument: (documentId) =>
    api.delete(`/documents/${documentId}`).then((r) => r.data),

  getCategories: () =>
    api.get('/documents/meta/categories').then((r) => r.data),
};

// Knowledge Base
export const knowledgeAPI = {
  getAll: () => api.get('/knowledge').then((r) => r.data),
  search: (query) => api.post('/knowledge/search', { query }).then((r) => r.data),
  reindex: () => api.post('/knowledge/reindex').then((r) => r.data),
  getIndexStatus: () => api.get('/knowledge/index').then((r) => r.data),
};

// Token & employee helpers
export const setToken = (token) => AsyncStorage.setItem('token', token);
export const getToken = () => AsyncStorage.getItem('token').catch(() => null);
export const clearToken = () => AsyncStorage.removeItem('token');

export const setEmployee = (emp) => AsyncStorage.setItem('employee', JSON.stringify(emp));
export const getEmployee = () =>
  AsyncStorage.getItem('employee').then((v) => (v ? JSON.parse(v) : null)).catch(() => null);
export const clearEmployee = () => AsyncStorage.removeItem('employee');

export default api;
