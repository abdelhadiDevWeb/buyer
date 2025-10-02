"use client";
import { useEffect, useState } from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await import('@/i18n');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeI18n();
  }, []);

  return <>{children}</>;
} 