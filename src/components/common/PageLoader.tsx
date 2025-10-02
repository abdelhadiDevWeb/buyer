"use client";
import React from 'react';
import ModernSpinner from './ModernSpinner';

interface PageLoaderProps {
  text?: string;
  variant?: 'orbit' | 'pulse' | 'wave' | 'dots' | 'ripple' | 'cube' | 'flower';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  text = 'Loading...',
  variant = 'orbit',
  size = 'lg',
  color = 'primary',
  fullScreen = false
}) => {
  const containerStyle: React.CSSProperties = fullScreen ? {
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
  } as React.CSSProperties : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    minHeight: '300px'
  } as React.CSSProperties;

  const contentStyle: React.CSSProperties = fullScreen ? {
    textAlign: 'center',
    padding: '40px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 99, 177, 0.1)',
    animation: 'slideUp 0.4s ease-out'
  } as React.CSSProperties : {
    textAlign: 'center'
  } as React.CSSProperties;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <ModernSpinner
          variant={variant}
          size={size}
          color={color}
          text={text}
        />
        {fullScreen && (
          <div style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#6b7280',
            opacity: 0.8
          }}>
            Please wait while we prepare your experience
          </div>
        )}
      </div>
      {fullScreen && (
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
      )}
    </div>
  );
};

export default PageLoader;
