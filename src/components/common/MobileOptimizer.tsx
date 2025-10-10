"use client";
import React, { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export const MobileOptimizer: React.FC<MobileOptimizerProps> = ({ children }) => {
  const { width, height, isMobile, isTablet, isIPhone, isSamsung } = useResponsive();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Prevent zoom on input focus (iOS)
    const preventZoom = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (viewport) {
          viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
      }
    };

    // Restore zoom capability after input blur
    const restoreZoom = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (viewport) {
          viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        }
      }
    };

    document.addEventListener('focusin', preventZoom);
    document.addEventListener('focusout', restoreZoom);

    // Optimize scrolling for mobile
    if (isMobile) {
      document.body.style.overflowX = 'hidden';
      (document.body.style as any).WebkitOverflowScrolling = 'touch';
    }

    // Add device-specific classes
    const body = document.body;
    body.classList.remove('iphone', 'samsung', 'mobile', 'tablet', 'desktop');
    
    if (isIPhone) {
      body.classList.add('iphone');
    } else if (isSamsung) {
      body.classList.add('samsung');
    }
    
    if (isMobile) {
      body.classList.add('mobile');
    } else if (isTablet) {
      body.classList.add('tablet');
    } else {
      body.classList.add('desktop');
    }

    return () => {
      document.removeEventListener('focusin', preventZoom);
      document.removeEventListener('focusout', restoreZoom);
    };
  }, [isMobile, isTablet, isIPhone, isSamsung]);

  // Add device-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Device-specific optimizations */
      .iphone {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
        --safe-area-inset-right: env(safe-area-inset-right);
      }
      
      .samsung {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
        --safe-area-inset-right: env(safe-area-inset-right);
      }
      
      .mobile {
        /* Mobile-specific optimizations */
        -webkit-text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        touch-action: manipulation;
      }
      
      .tablet {
        /* Tablet-specific optimizations */
        -webkit-text-size-adjust: 100%;
      }
      
      .desktop {
        /* Desktop-specific optimizations */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Prevent horizontal scroll on all devices */
      html, body {
        overflow-x: hidden !important;
        max-width: 100vw !important;
      }
      
      /* Optimize touch targets */
      @media (max-width: 768px) {
        button, [role="button"], a, .clickable {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0, 99, 177, 0.1);
        }
      }
      
      /* iPhone specific fixes */
      @media (max-width: 428px) and (min-width: 375px) {
        .iphone .container-responsive {
          padding-left: 16px;
          padding-right: 16px;
        }
      }
      
      /* Samsung specific fixes */
      @media (max-width: 412px) and (min-width: 360px) {
        .samsung .container-responsive {
          padding-left: 12px;
          padding-right: 12px;
        }
      }
      
      /* Small mobile devices */
      @media (max-width: 375px) {
        .mobile .container-responsive {
          padding-left: 12px;
          padding-right: 12px;
        }
        
        .mobile .header-logo {
          max-height: 45px !important;
          max-width: 110px !important;
        }
      }
      
      /* Prevent text selection on interactive elements */
      .mobile button, .mobile [role="button"] {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Optimize animations for mobile */
      .mobile * {
        animation-duration: 0.3s !important;
        transition-duration: 0.3s !important;
      }
      
      /* Improve scrolling performance */
      .mobile-scroll {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* Fix iOS Safari viewport issues */
      @supports (-webkit-touch-callout: none) {
        .iphone .hero-banner-section {
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }
      }
      
      /* Fix Samsung browser issues */
      .samsung input, .samsung textarea, .samsung select {
        font-size: 16px;
        -webkit-appearance: none;
        border-radius: 8px;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isMobile, isTablet, isIPhone, isSamsung]);

  if (!isClient) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <div 
      className={`mobile-optimizer ${isIPhone ? 'iphone' : ''} ${isSamsung ? 'samsung' : ''} ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}
      style={{
        width: '100%',
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

export default MobileOptimizer;
