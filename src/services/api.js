import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import EventSource from 'react-native-sse';

const DEFAULT_API_URL = 'http://35.209.74.112:3000/api';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function handleSSEPayload(payload, onChunk, onDone) {
  const dataLines = payload
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return false;

  const raw = dataLines.join('\n').trim();
  if (!raw) return false;

  if (raw === '[DONE]') {
    onDone?.();
    return true;
  }

  try {
    const data = JSON.parse(raw);
    if (data.type === 'done') {
      onDone?.();
      return true;
    }

    onChunk?.(data);
  } catch {
    // ignore malformed events
  }

  return false;
}

function flushSSEBuffer(buffer, onChunk, onDone) {
  let rest = buffer;
  let finished = false;

  while (rest.includes('\n\n')) {
    const separatorIndex = rest.indexOf('\n\n');
    const payload = rest.slice(0, separatorIndex);
    rest = rest.slice(separatorIndex + 2);

    if (handleSSEPayload(payload, onChunk, onDone)) {
      finished = true;
      break;
    }
  }

  return { buffer: rest, finished };
}

async function createWebStream(message, employeeId, onChunk, onDone, onError) {
  const token = await getToken();
  const controller = new AbortController();
  let closed = false;

  const close = () => {
    closed = true;
    controller.abort();
  };

  (async () => {
    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, employeeId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Streaming request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming response body is unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = flushSSEBuffer(buffer, onChunk, onDone);
        buffer = parsed.buffer;

        if (parsed.finished) {
          finished = true;
          break;
        }
      }

      buffer += decoder.decode();

      if (!finished && buffer.trim()) {
        finished = handleSSEPayload(buffer, onChunk, onDone);
      }

      if (!finished && !closed) {
        onDone?.();
      }
    } catch (error) {
      if (closed || error.name === 'AbortError') return;
      onError?.(error);
    }
  })();

  return close;
}

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

  sendMessageStream: async (message, employeeId, onChunk, onDone, onError) => {
    if (Platform.OS === 'web') {
      return createWebStream(message, employeeId, onChunk, onDone, onError);
    }

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
          onChunk?.(data);
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
