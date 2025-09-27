"use client";
import React from 'react';

interface ModernSpinnerProps {
  variant?: 'orbit' | 'pulse' | 'wave' | 'dots' | 'ripple' | 'cube' | 'flower';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  text?: string;
  className?: string;
}

const ModernSpinner: React.FC<ModernSpinnerProps> = ({
  variant = 'orbit',
  size = 'md',
  color = 'primary',
  text,
  className = ''
}) => {
  const sizeStyles = {
    sm: { width: '24px', height: '24px' },
    md: { width: '40px', height: '40px' },
    lg: { width: '60px', height: '60px' },
    xl: { width: '80px', height: '80px' }
  };

  const colorStyles = {
    primary: '#0063b1',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    white: '#ffffff'
  };

  const renderSpinner = () => {
    const sizeStyle = sizeStyles[size];
    const colorValue = colorStyles[color];

    switch (variant) {
      case 'orbit':
        return (
          <div style={{
            position: 'relative',
            ...sizeStyle
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: `3px solid ${colorValue}20`,
              borderTop: `3px solid ${colorValue}`,
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '50%',
              height: '50%',
              border: `2px solid ${colorValue}30`,
              borderTop: `2px solid ${colorValue}`,
              borderRadius: '50%',
              animation: 'spin-reverse 0.8s linear infinite'
            }}></div>
          </div>
        );

      case 'pulse':
        return (
          <div style={{
            position: 'relative',
            ...sizeStyle
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: colorValue,
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
              backgroundColor: colorValue,
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite 0.3s'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '40%',
              width: '20%',
              height: '20%',
              backgroundColor: colorValue,
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite 0.6s'
            }}></div>
          </div>
        );

      case 'wave':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            ...sizeStyle
          }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '60%',
                  backgroundColor: colorValue,
                  borderRadius: '2px',
                  animation: `wave 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        );

      case 'dots':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            ...sizeStyle
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: colorValue,
                  borderRadius: '50%',
                  animation: `bounce 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.16}s`
                }}
              ></div>
            ))}
          </div>
        );

      case 'ripple':
        return (
          <div style={{
            position: 'relative',
            ...sizeStyle
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '60%',
              height: '60%',
              margin: '-30% 0 0 -30%',
              border: `2px solid ${colorValue}`,
              borderRadius: '50%',
              animation: 'ripple 1.5s ease-out infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '60%',
              height: '60%',
              margin: '-30% 0 0 -30%',
              border: `2px solid ${colorValue}`,
              borderRadius: '50%',
              animation: 'ripple 1.5s ease-out infinite 0.5s'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '20%',
              height: '20%',
              margin: '-10% 0 0 -10%',
              backgroundColor: colorValue,
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
          </div>
        );

      case 'cube':
        return (
          <div style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            ...sizeStyle
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: colorValue,
              animation: 'cube-rotate 2s linear infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: `${colorValue}80`,
              animation: 'cube-rotate 2s linear infinite 0.5s'
            }}></div>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: `${colorValue}40`,
              animation: 'cube-rotate 2s linear infinite 1s'
            }}></div>
          </div>
        );

      case 'flower':
        return (
          <div style={{
            position: 'relative',
            ...sizeStyle
          }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '20%',
                  height: '20%',
                  margin: '-10% 0 0 -10%',
                  backgroundColor: colorValue,
                  borderRadius: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-150%)`,
                  animation: 'flower-pulse 2s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '30%',
              height: '30%',
              margin: '-15% 0 0 -15%',
              backgroundColor: colorValue,
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
          </div>
        );

      default:
        return (
          <div style={{
            width: '100%',
            height: '100%',
            border: `3px solid ${colorValue}20`,
            borderTop: `3px solid ${colorValue}`,
            borderRadius: '50%',
            animation: 'spin 1.2s linear infinite'
          }}></div>
        );
    }
  };

  return (
    <div className={`modern-spinner ${className}`} style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block' }}>
        {renderSpinner()}
      </div>
      {text && (
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: colorStyles[color],
          fontWeight: '500',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          {text}
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
        
        @keyframes wave {
          0%, 40%, 100% { 
            transform: scaleY(0.4);
          }
          20% { 
            transform: scaleY(1);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          }
          40% { 
            transform: scale(1);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        @keyframes cube-rotate {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        
        @keyframes flower-pulse {
          0%, 100% { 
            transform: rotate(var(--rotation)) translateY(-150%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: rotate(var(--rotation)) translateY(-150%) scale(1.3);
            opacity: 0.7;
          }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ModernSpinner;
