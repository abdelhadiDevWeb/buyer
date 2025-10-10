// Responsive utility functions for enhanced mobile experience

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIPhone: boolean;
  isSamsung: boolean;
  isSmallMobile: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

// Device detection utilities
export const getDeviceInfo = (width: number, height: number): DeviceInfo => {
  return {
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024,
    isIPhone: width >= 375 && width <= 428,
    isSamsung: width >= 360 && width <= 412,
    isSmallMobile: width <= 375,
    width,
    height,
    orientation: width > height ? 'landscape' : 'portrait',
  };
};

// Responsive value utility
export const getResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  deviceInfo?: DeviceInfo
): T => {
  if (!deviceInfo) return mobile;
  
  if (deviceInfo.isMobile) return mobile;
  if (deviceInfo.isTablet && tablet !== undefined) return tablet;
  if (deviceInfo.isDesktop && desktop !== undefined) return desktop;
  
  return mobile;
};

// Safe area utilities
export const getSafeAreaStyles = (deviceInfo: DeviceInfo) => {
  const baseStyles = {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  };

  if (deviceInfo.isIPhone) {
    return {
      ...baseStyles,
      // iPhone-specific adjustments
      minHeight: '100vh',
      WebkitOverflowScrolling: 'touch' as const,
    };
  }

  if (deviceInfo.isSamsung) {
    return {
      ...baseStyles,
      // Samsung-specific adjustments
      minHeight: '100vh',
    };
  }

  return baseStyles;
};

// Touch target utilities
export const getTouchTargetStyles = (deviceInfo: DeviceInfo) => {
  const baseSize = deviceInfo.isSmallMobile ? 40 : 44;
  
  return {
    minHeight: `${baseSize}px`,
    minWidth: `${baseSize}px`,
    touchAction: 'manipulation' as const,
    WebkitTapHighlightColor: 'rgba(0, 99, 177, 0.1)',
    cursor: 'pointer' as const,
  };
};

// Container utilities
export const getContainerStyles = (deviceInfo: DeviceInfo) => {
  const padding = deviceInfo.isSmallMobile ? 12 : deviceInfo.isMobile ? 16 : 20;
  
  return {
    padding: `0 ${padding}px`,
    maxWidth: '100vw',
    overflowX: 'hidden' as const,
    boxSizing: 'border-box' as const,
  };
};

// Typography utilities
export const getTypographyStyles = (deviceInfo: DeviceInfo, size: 'sm' | 'base' | 'lg' | 'xl') => {
  const sizes = {
    sm: deviceInfo.isSmallMobile ? 13 : deviceInfo.isMobile ? 14 : 16,
    base: deviceInfo.isSmallMobile ? 15 : deviceInfo.isMobile ? 16 : 18,
    lg: deviceInfo.isSmallMobile ? 17 : deviceInfo.isMobile ? 18 : 20,
    xl: deviceInfo.isSmallMobile ? 19 : deviceInfo.isMobile ? 20 : 24,
  };

  return {
    fontSize: `${sizes[size]}px`,
    lineHeight: 1.5,
    WebkitTextSizeAdjust: '100%',
    textRendering: 'optimizeLegibility' as const,
  };
};

// Spacing utilities
export const getSpacingStyles = (deviceInfo: DeviceInfo, size: 'sm' | 'md' | 'lg') => {
  const spacings = {
    sm: deviceInfo.isSmallMobile ? 8 : deviceInfo.isMobile ? 12 : 16,
    md: deviceInfo.isSmallMobile ? 16 : deviceInfo.isMobile ? 20 : 24,
    lg: deviceInfo.isSmallMobile ? 24 : deviceInfo.isMobile ? 32 : 40,
  };

  return {
    padding: `${spacings[size]}px`,
    margin: `${spacings[size]}px 0`,
  };
};

// Animation utilities
export const getAnimationStyles = (deviceInfo: DeviceInfo) => {
  if (deviceInfo.isMobile) {
    return {
      animationDuration: '0.3s',
      transitionDuration: '0.3s',
      willChange: 'transform, opacity',
    };
  }

  return {
    animationDuration: '0.5s',
    transitionDuration: '0.5s',
    willChange: 'transform, opacity',
  };
};

// Grid utilities
export const getGridStyles = (deviceInfo: DeviceInfo, columns?: number) => {
  const defaultColumns = deviceInfo.isMobile ? 1 : deviceInfo.isTablet ? 2 : 3;
  const cols = columns || defaultColumns;

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: deviceInfo.isMobile ? '16px' : '24px',
    width: '100%',
    boxSizing: 'border-box' as const,
  };
};

// Image utilities
export const getImageStyles = (deviceInfo: DeviceInfo, aspectRatio?: string) => {
  return {
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    objectFit: 'cover' as const,
    aspectRatio: aspectRatio || (deviceInfo.isMobile ? '16/9' : '4/3'),
    borderRadius: deviceInfo.isMobile ? '8px' : '12px',
  };
};

// Form utilities
export const getFormStyles = (deviceInfo: DeviceInfo) => {
  return {
    fontSize: '16px', // Prevents zoom on iOS
    padding: deviceInfo.isMobile ? '12px 16px' : '14px 18px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    WebkitAppearance: 'none' as const,
    appearance: 'none' as const,
    minHeight: '44px',
    touchAction: 'manipulation' as const,
  };
};

// Modal utilities
export const getModalStyles = (deviceInfo: DeviceInfo) => {
  return {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100vh',
    zIndex: 1000,
    ...getSafeAreaStyles(deviceInfo),
    WebkitOverflowScrolling: 'touch' as const,
    touchAction: 'pan-y' as const,
  };
};

// Button utilities
export const getButtonStyles = (deviceInfo: DeviceInfo, variant: 'primary' | 'secondary' = 'primary') => {
  const baseStyles = {
    ...getTouchTargetStyles(deviceInfo),
    borderRadius: deviceInfo.isMobile ? '8px' : '12px',
    fontSize: deviceInfo.isMobile ? '16px' : '18px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  if (variant === 'primary') {
    return {
      ...baseStyles,
      background: 'linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(0, 99, 177, 0.3)',
    };
  }

  return {
    ...baseStyles,
    background: 'white',
    color: '#0063b1',
    border: '2px solid #0063b1',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };
};

// Card utilities
export const getCardStyles = (deviceInfo: DeviceInfo) => {
  return {
    background: 'white',
    borderRadius: deviceInfo.isMobile ? '12px' : '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    ...getSpacingStyles(deviceInfo, 'md'),
  };
};

const responsiveUtils = {
  getDeviceInfo,
  getResponsiveValue,
  getSafeAreaStyles,
  getTouchTargetStyles,
  getContainerStyles,
  getTypographyStyles,
  getSpacingStyles,
  getAnimationStyles,
  getGridStyles,
  getImageStyles,
  getFormStyles,
  getModalStyles,
  getButtonStyles,
  getCardStyles,
};

export default responsiveUtils;
