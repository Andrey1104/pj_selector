import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, defaultLanguage, supportedLanguages } from './translations';

const I18nContext = createContext(null);

const STORAGE_KEY = 'pj-selector-language';

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && translations[stored]) {
        return stored;
      }
    }
    return defaultLanguage;
  });

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    }
  }, []);

  const t = useCallback((key, params = {}) => {
    const value = translations[language]?.[key] || translations[defaultLanguage]?.[key] || key;
    
    // Replace {param} placeholders with actual values
    return Object.entries(params).reduce((str, [param, val]) => {
      return str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val));
    }, value);
  }, [language]);

  useEffect(() => {
    // Update document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    supportedLanguages,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export { translations, supportedLanguages, defaultLanguage };
