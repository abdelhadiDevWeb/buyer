"use client";
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ModernSpinner from './ModernSpinner';

const GlobalLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const pathname = usePathname();

  useEffect(() => {
    // Show loading when pathname changes (navigation)
    if (pathname) {
      setIsLoading(true);
      setLoadingText('Loading page...');
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    // Handle page refresh
    const handleBeforeUnload = () => {
      setIsLoading(true);
      setLoadingText('Refreshing...');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Show loading on initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 99, 177, 0.1)',
        animation: 'slideUp 0.4s ease-out'
      }}>
        <ModernSpinner
          variant="flower"
          size="xl"
          color="primary"
          text={loadingText}
        />
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#6b7280',
          opacity: 0.8
        }}>
          Please wait while we prepare your experience
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideUp {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(0.9);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;
