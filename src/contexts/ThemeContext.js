import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../styles/theme';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'forum.theme';

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      const storedTheme =
        (await AsyncStorage.getItem(THEME_STORAGE_KEY)) ?? (await AsyncStorage.getItem('theme'));
      if (storedTheme === 'dark') setIsDark(true);
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    const nextTheme = next ? 'dark' : 'light';
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    await AsyncStorage.setItem('theme', nextTheme);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? 'dark' : 'light', toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
