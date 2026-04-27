import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL - для эмулятора используем 10.0.2.2 вместо localhost
const API_URL = 'http://10.0.2.2:3001/api';

// Для iOS симулятора и Expo Go используем localhost
// const API_URL = 'http://localhost:3001/api';

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
