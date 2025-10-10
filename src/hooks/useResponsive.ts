import { useState, useEffect } from 'react';

// Define breakpoints
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isIPhone: boolean;
  isSamsung: boolean;
  isSmallMobile: boolean;
  orientation: 'portrait' | 'landscape';
}

// Custom hook for responsive behavior
export const useResponsive = (): ResponsiveState => {
  const [windowSize, setWindowSize] = useState<{width: number; height: number}>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    // Function to update window size
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Set initial size
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = windowSize;

  return {
    width,
    height,
    
    // Device categories
    isMobile: width < BREAKPOINTS.md, // < 768px
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768px - 1024px
    isLaptop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl, // 1024px - 1280px
    isDesktop: width >= BREAKPOINTS.xl, // >= 1280px
    
    // Specific breakpoints
    isXs: width < BREAKPOINTS.xs, // < 475px
    isSm: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm, // 475px - 640px
    isMd: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md, // 640px - 768px
    isLg: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768px - 1024px
    isXl: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl, // 1024px - 1280px
    is2xl: width >= BREAKPOINTS.xl, // >= 1280px
    
    // Device-specific detection
    isIPhone: width >= 375 && width <= 428,
    isSamsung: width >= 360 && width <= 412,
    isSmallMobile: width <= 375,
    
    // Orientation
    orientation: width > height ? 'landscape' : 'portrait'
  };
};

// Utility function to check if screen matches a breakpoint
export const useBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
};

// Hook for media queries
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Common responsive utilities
export const getResponsiveValue = <T>(
  values: Partial<Record<BreakpointKey | 'base', T>>,
  currentWidth: number
): T => {
  const sortedBreakpoints = Object.entries(BREAKPOINTS)
    .sort(([, a], [, b]) => b - a) // Sort descending
    .map(([key]) => key as BreakpointKey);

  // Check breakpoints from largest to smallest
  for (const breakpoint of sortedBreakpoints) {
    if (currentWidth >= BREAKPOINTS[breakpoint] && values[breakpoint] !== undefined) {
      return values[breakpoint]!;
    }
  }

  // Fallback to base value
  return values.base!;
};

export default useResponsive;