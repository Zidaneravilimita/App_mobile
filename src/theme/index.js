// src/theme/index.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'pref_theme'; // 'light' | 'dark'

export const themes = {
  dark: {
    name: 'dark',
    colors: {
      background: '#1a1a1a',
      surface: '#222',
      card: '#333',
      text: '#ffffff',
      subtext: '#cccccc',
      border: '#333333',
      primary: '#8A2BE2',
      danger: '#E53935',
      success: '#4CAF50',
      muted: '#666666',
    },
  },
  light: {
    name: 'light',
    colors: {
      background: '#ffffff',
      surface: '#f4f4f7',
      card: '#ffffff',
      text: '#111111',
      subtext: '#555555',
      border: '#dddddd',
      primary: '#8A2BE2',
      danger: '#E53935',
      success: '#4CAF50',
      muted: '#888888',
    },
  },
};

const ThemeContext = createContext({
  theme: themes.dark,
  colors: themes.dark.colors,
  setThemeName: (_name) => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeNameState] = useState('dark');
  const theme = themes[themeName] || themes.dark;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') setThemeNameState(saved);
      } catch {}
    })();
  }, []);

  const setThemeName = async (name) => {
    if (name !== 'light' && name !== 'dark') return;
    setThemeNameState(name);
    try { await AsyncStorage.setItem(THEME_KEY, name); } catch {}
  };

  const value = useMemo(() => ({ theme, colors: theme.colors, setThemeName }), [themeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
