import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeStorage } from '../services/storage';
import { darkColors, lightColors, ThemeColors } from './colors';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = '@hangloop_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  colors: darkColors,
  isDark: true,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Load persisted theme preference using SafeStorage
    const loadTheme = async () => {
      try {
        const savedTheme = await SafeStorage.getItem(STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.warn('Failed to load theme preference from storage', error);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SafeStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference to storage', error);
    }
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const colors = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colors,
        isDark: themeMode === 'dark',
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
