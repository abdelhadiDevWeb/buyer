"use client";
import React, { ReactNode } from 'react';
import { useResponsive, BreakpointKey, BREAKPOINTS } from '@/hooks/useResponsive';

interface ResponsiveWrapperProps {
  children: ReactNode;
  show?: BreakpointKey[]; // Show only on these breakpoints
  hide?: BreakpointKey[]; // Hide on these breakpoints
  minWidth?: number; // Custom min width
  maxWidth?: number; // Custom max width
  className?: string;
  style?: React.CSSProperties;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  show,
  hide,
  minWidth,
  maxWidth,
  className = '',
  style = {}
}) => {
  const { width } = useResponsive();

  // Check if should show based on breakpoints
  const shouldShow = () => {
    // Check custom width constraints first
    if (minWidth && width < minWidth) return false;
    if (maxWidth && width > maxWidth) return false;

    // Check show constraint
    if (show && show.length > 0) {
      const shouldShowBasedOnBreakpoints = show.some(breakpoint => {
        if (breakpoint === 'xs') return width < BREAKPOINTS.xs;
        if (breakpoint === 'sm') return width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm;
        if (breakpoint === 'md') return width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
        if (breakpoint === 'lg') return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
        if (breakpoint === 'xl') return width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
        if (breakpoint === '2xl') return width >= BREAKPOINTS.xl;
        return false;
      });
      if (!shouldShowBasedOnBreakpoints) return false;
    }

    // Check hide constraint
    if (hide && hide.length > 0) {
      const shouldHideBasedOnBreakpoints = hide.some(breakpoint => {
        if (breakpoint === 'xs') return width < BREAKPOINTS.xs;
        if (breakpoint === 'sm') return width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm;
        if (breakpoint === 'md') return width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
        if (breakpoint === 'lg') return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
        if (breakpoint === 'xl') return width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
        if (breakpoint === '2xl') return width >= BREAKPOINTS.xl;
        return false;
      });
      if (shouldHideBasedOnBreakpoints) return false;
    }

    return true;
  };

  if (!shouldShow()) {
    return null;
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

// Convenience components for common use cases
export const MobileOnly: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <ResponsiveWrapper maxWidth={767} className={className}>
    {children}
  </ResponsiveWrapper>
);

export const TabletOnly: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <ResponsiveWrapper minWidth={768} maxWidth={1023} className={className}>
    {children}
  </ResponsiveWrapper>
);

export const DesktopOnly: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <ResponsiveWrapper minWidth={1024} className={className}>
    {children}
  </ResponsiveWrapper>
);

export const MobileAndTablet: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <ResponsiveWrapper maxWidth={1023} className={className}>
    {children}
  </ResponsiveWrapper>
);

export const TabletAndDesktop: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <ResponsiveWrapper minWidth={768} className={className}>
    {children}
  </ResponsiveWrapper>
);

export default ResponsiveWrapper;