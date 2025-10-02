"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IoLanguage } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useLanguage } from '@/contexts/LanguageContext';

const FloatingLanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { languageChanged } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇬🇧',
      dir: 'ltr'
    },
    {
      code: 'fr',
      name: 'Français',
      flag: '🇫🇷',
      dir: 'ltr'
    },
    {
      code: 'ar',
      name: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update HTML lang and dir attributes when language changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', i18n.language);
    html.setAttribute('dir', currentLanguage.dir);
  }, [i18n.language, currentLanguage.dir]);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('i18nextLng', languageCode);
    setIsOpen(false);
    
    // Force a page refresh to ensure all components update
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div 
      ref={dropdownRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'white',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0063b1';
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 99, 177, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        }}
      >
        <span style={{ fontSize: '20px' }}>{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '0',
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            marginBottom: '10px',
            overflow: 'hidden',
            zIndex: 1001,
            minWidth: '140px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 15px',
                background: i18n.language === language.code ? '#f0f8ff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                color: i18n.language === language.code ? '#0063b1' : '#333',
                fontWeight: i18n.language === language.code ? '600' : '400',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (i18n.language !== language.code) {
                  e.currentTarget.style.background = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (i18n.language !== language.code) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{language.flag}</span>
              <span>{language.name}</span>
              {i18n.language === language.code && (
                <div
                  style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#0063b1'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Add some animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FloatingLanguageSwitcher; 