"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [isRTL, setIsRTL] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languageChanged, setLanguageChanged] = useState(0);
  const [i18nReady, setI18nReady] = useState(false);
  const [i18n, setI18n] = useState(null);

  const languages = {
    en: { dir: 'ltr', isRTL: false },
    fr: { dir: 'ltr', isRTL: false },
    ar: { dir: 'rtl', isRTL: true }
  };

  // Initialize i18n
  useEffect(() => {
    const initI18n = async () => {
      try {
        const i18nModule = await import('@/i18n');
        const i18nInstance = i18nModule.default;
        
        if (i18nInstance.isInitialized) {
          setI18n(i18nInstance);
          setI18nReady(true);
        } else {
          i18nInstance.on('initialized', () => {
            setI18n(i18nInstance);
            setI18nReady(true);
          });
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setI18nReady(true); // Continue anyway
      }
    };

    initI18n();
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
    const languageConfig = languages[savedLanguage] || languages.en;
    
    setCurrentLanguage(savedLanguage);
    setIsRTL(languageConfig.isRTL);
    
    // Update HTML attributes
    const html = document.documentElement;
    html.setAttribute('lang', savedLanguage);
    html.setAttribute('dir', languageConfig.dir);
    
    // Add RTL-specific styles
    if (languageConfig.isRTL) {
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
    } else {
      document.body.style.direction = 'ltr';
      document.body.style.textAlign = 'left';
    }
  }, []);

  useEffect(() => {
    if (!i18n || !i18nReady) return;

    const handleLanguageChange = (lng) => {
      const languageConfig = languages[lng] || languages.en;
      
      setCurrentLanguage(lng);
      setIsRTL(languageConfig.isRTL);
      setLanguageChanged(prev => prev + 1); // Force re-render
      
      // Update HTML attributes
      const html = document.documentElement;
      html.setAttribute('lang', lng);
      html.setAttribute('dir', languageConfig.dir);
      
      // Add RTL-specific styles
      if (languageConfig.isRTL) {
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
      } else {
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, i18nReady]);

  const value = {
    currentLanguage,
    isRTL,
    languages,
    languageChanged,
    setLanguage: (languageCode) => {
      if (i18n && i18nReady) {
        i18n.changeLanguage(languageCode);
        localStorage.setItem('i18nextLng', languageCode);
      }
    }
  };

  // Don't render children until i18n is ready
  if (!i18nReady) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 