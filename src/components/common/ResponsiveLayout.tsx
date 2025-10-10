"use client";
import React, { ReactNode } from 'react';
import { useResponsive, BreakpointKey, BREAKPOINTS } from '@/hooks/useResponsive';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // Device-specific props
  mobileProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
  tabletProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
  desktopProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
  // iPhone specific
  iPhoneProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
  // Samsung specific
  samsungProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  style = {},
  mobileProps,
  tabletProps,
  desktopProps,
  iPhoneProps,
  samsungProps,
}) => {
  const { width, isMobile, isTablet, isDesktop, isXs, isSm } = useResponsive();

  // Determine device type
  const isIPhone = width >= 375 && width <= 428; // iPhone SE to iPhone 12 Pro Max
  const isSamsung = width >= 360 && width <= 412; // Samsung Galaxy range

  // Get appropriate props based on device
  const getResponsiveProps = () => {
    if (isIPhone && iPhoneProps) {
      return {
        className: `${className} ${iPhoneProps.className || ''}`.trim(),
        style: { ...style, ...iPhoneProps.style },
      };
    }
    
    if (isSamsung && samsungProps) {
      return {
        className: `${className} ${samsungProps.className || ''}`.trim(),
        style: { ...style, ...samsungProps.style },
      };
    }

    if (isMobile && mobileProps) {
      return {
        className: `${className} ${mobileProps.className || ''}`.trim(),
        style: { ...style, ...mobileProps.style },
      };
    }

    if (isTablet && tabletProps) {
      return {
        className: `${className} ${tabletProps.className || ''}`.trim(),
        style: { ...style, ...tabletProps.style },
      };
    }

    if (isDesktop && desktopProps) {
      return {
        className: `${className} ${desktopProps.className || ''}`.trim(),
        style: { ...style, ...desktopProps.style },
      };
    }

    return { className, style };
  };

  const responsiveProps = getResponsiveProps();

  return (
    <div {...responsiveProps}>
      {children}
    </div>
  );
};

// Specialized components for common use cases
export const MobileFirstLayout: React.FC<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <ResponsiveLayout
    className={`mobile-first ${className}`}
    style={style}
    mobileProps={{
      className: 'mobile-optimized',
      style: { padding: '16px', fontSize: '16px' }
    }}
    tabletProps={{
      className: 'tablet-optimized',
      style: { padding: '20px', fontSize: '17px' }
    }}
    desktopProps={{
      className: 'desktop-optimized',
      style: { padding: '24px', fontSize: '18px' }
    }}
  >
    {children}
  </ResponsiveLayout>
);

export const TouchOptimizedLayout: React.FC<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <ResponsiveLayout
    className={`touch-optimized ${className}`}
    style={style}
    mobileProps={{
      className: 'touch-friendly',
      style: { 
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(0, 99, 177, 0.1)'
      }
    }}
    iPhoneProps={{
      className: 'iphone-touch',
      style: { 
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(0, 99, 177, 0.1)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }
    }}
    samsungProps={{
      className: 'samsung-touch',
      style: { 
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(0, 99, 177, 0.1)'
      }
    }}
  >
    {children}
  </ResponsiveLayout>
);

export const SafeAreaLayout: React.FC<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <ResponsiveLayout
    className={`safe-area ${className}`}
    style={style}
    iPhoneProps={{
      className: 'iphone-safe-area',
      style: { 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }
    }}
    samsungProps={{
      className: 'samsung-safe-area',
      style: { 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }
    }}
  >
    {children}
  </ResponsiveLayout>
);

// Container components with responsive behavior
export const ResponsiveContainer: React.FC<{
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <ResponsiveLayout
    className={`container-responsive ${className}`}
    style={style}
    mobileProps={{
      className: 'mobile-container',
      style: { 
        padding: '0 16px',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }
    }}
    iPhoneProps={{
      className: 'iphone-container',
      style: { 
        padding: '0 16px',
        maxWidth: '100vw',
        overflowX: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }
    }}
    samsungProps={{
      className: 'samsung-container',
      style: { 
        padding: '0 12px',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }
    }}
    tabletProps={{
      className: 'tablet-container',
      style: { 
        padding: '0 24px',
        maxWidth: '100vw'
      }
    }}
    desktopProps={{
      className: 'desktop-container',
      style: { 
        padding: '0 32px',
        maxWidth: '1400px',
        margin: '0 auto'
      }
    }}
  >
    {children}
  </ResponsiveLayout>
);

export default ResponsiveLayout;
