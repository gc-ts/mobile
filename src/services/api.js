import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL
const API_URL = 'http://35.208.248.206:3000/api';

// Для локальной разработки:
// Android эмулятор: 'http://10.0.2.2:3000/api'
// iOS симулятор: 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (login, password) => {
    const response = await api.post('/auth/login', { login, password });
    return response.data;
  },

  register: async (employeeData) => {
    const response = await api.post('/auth/register', employeeData);
    return response.data;
  },

  verify: async (token) => {
    const response = await api.post('/auth/verify', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message, employeeId) => {
    const response = await api.post('/chat/message', {
      message,
      employeeId,
    });
    return response.data;
  },

  getHistory: async (employeeId) => {
    const response = await api.get(`/chat/history/${employeeId}`);
    return response.data;
  },
};

// Employee API
export const employeeAPI = {
  getEmployee: async (employeeId) => {
    const response = await api.get(`/employee/${employeeId}`);
    return response.data;
  },

  getVacation: async (employeeId) => {
    const response = await api.get(`/employee/${employeeId}/vacation`);
    return response.data;
  },

  getBirthday: async (employeeId) => {
    const response = await api.get(`/employee/${employeeId}/birthday`);
    return response.data;
  },

  auth: async (employeeId, email) => {
    const response = await api.post('/employee/auth', { employeeId, email });
    return response.data;
  },

  searchByName: async (name) => {
    const response = await api.get(`/employee/search/by-name?name=${encodeURIComponent(name)}`);
    return response.data;
  },
};

// Documents API
export const documentsAPI = {
  getDocuments: async (category = null, type = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);

    const url = params.toString() ? `/documents?${params.toString()}` : '/documents';
    const response = await api.get(url);
    return response.data;
  },

  getDocument: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  uploadDocument: async (file, title, category, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('type', type);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/documents/meta/categories');
    return response.data;
  },
};

// Knowledge Base API
export const knowledgeAPI = {
  getAll: async () => {
    const response = await api.get('/knowledge');
    return response.data;
  },

  search: async (query) => {
    const response = await api.post('/knowledge/search', { query });
    return response.data;
  },

  reindex: async () => {
    const response = await api.post('/knowledge/reindex');
    return response.data;
  },

  getIndexStatus: async () => {
    const response = await api.get('/knowledge/index');
    return response.data;
  },
};

// Token storage helpers with AsyncStorage
export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('Error clearing token:', error);
  }
};

export const setEmployee = async (employee) => {
  try {
    await AsyncStorage.setItem('employee', JSON.stringify(employee));
  } catch (error) {
    console.error('Error saving employee:', error);
  }
};

export const getEmployee = async () => {
  try {
    const employee = await AsyncStorage.getItem('employee');
    return employee ? JSON.parse(employee) : null;
  } catch (error) {
    console.error('Error getting employee:', error);
    return null;
  }
};

export const clearEmployee = async () => {
  try {
    await AsyncStorage.removeItem('employee');
  } catch (error) {
    console.error('Error clearing employee:', error);
  }
};

export default api;
