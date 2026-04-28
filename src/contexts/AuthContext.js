import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken, clearToken, setEmployee, clearEmployee } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployeeState] = useState(null);
  const [token, setTokenState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await getToken();
        const savedEmployee = await AsyncStorage.getItem('employee');
        if (savedToken && savedEmployee) {
          setTokenState(savedToken);
          setEmployeeState(JSON.parse(savedEmployee));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (employeeData, authToken) => {
    await setToken(authToken);
    await setEmployee(employeeData);
    setTokenState(authToken);
    setEmployeeState(employeeData);
  };

  const updateEmployee = async (employeeData) => {
    const nextEmployee = { ...(employee || {}), ...(employeeData || {}) };
    await setEmployee(nextEmployee);
    setEmployeeState(nextEmployee);
  };

  const logout = async () => {
    await clearToken();
    await clearEmployee();
    setTokenState(null);
    setEmployeeState(null);
  };

  return (
    <AuthContext.Provider value={{ isLoading, employee, token, login, logout, updateEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
