// src/i18n/index.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = 'pref_lang'; // 'fr' | 'en'

const messages = {
  fr: {
    settings: 'Paramètres',
    appearance: 'Apparence',
    darkTheme: 'Thème sombre',
    notifications: 'Notifications',
    enableNotifications: 'Activer les notifications',
    language: 'Langue',
    french: 'Français',
    english: 'Anglais',
    saving: 'Sauvegarde...',
  },
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    darkTheme: 'Dark theme',
    notifications: 'Notifications',
    enableNotifications: 'Enable notifications',
    language: 'Language',
    french: 'French',
    english: 'English',
    saving: 'Saving...',
  },
};

const I18nContext = createContext({
  lang: 'fr',
  t: (k) => k,
  setLanguage: (_l) => {},
});

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === 'fr' || saved === 'en') setLang(saved);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = async (l) => {
    if (l !== 'fr' && l !== 'en') return;
    setLang(l);
    try { await AsyncStorage.setItem(LANG_KEY, l); } catch {}
  };

  const t = useMemo(() => {
    const dict = messages[lang] || messages.fr;
    return (key) => dict[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLanguage }), [lang, t]);

  if (!ready) return null; // avoid flash before lang loads

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
