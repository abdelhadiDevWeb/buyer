"use client";
import React, { useState, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveTestProps {
  show?: boolean;
}

export const ResponsiveTest: React.FC<ResponsiveTestProps> = ({ show = false }) => {
  const responsive = useResponsive();
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    // Show test panel if URL contains debug parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'responsive' || show) {
      setIsVisible(true);
    }
  }, [show]);

  if (!isVisible) return null;

  const deviceInfo = [
    { label: 'Width', value: `${responsive.width}px` },
    { label: 'Height', value: `${responsive.height}px` },
    { label: 'Orientation', value: responsive.orientation },
    { label: 'Is Mobile', value: responsive.isMobile ? 'Yes' : 'No' },
    { label: 'Is Tablet', value: responsive.isTablet ? 'Yes' : 'No' },
    { label: 'Is Desktop', value: responsive.isDesktop ? 'Yes' : 'No' },
    { label: 'Is iPhone', value: responsive.isIPhone ? 'Yes' : 'No' },
    { label: 'Is Samsung', value: responsive.isSamsung ? 'Yes' : 'No' },
    { label: 'Is Small Mobile', value: responsive.isSmallMobile ? 'Yes' : 'No' },
  ];

  const breakpoints = [
    { name: 'XS', value: '475px', active: responsive.isXs },
    { name: 'SM', value: '640px', active: responsive.isSm },
    { name: 'MD', value: '768px', active: responsive.isMd },
    { name: 'LG', value: '1024px', active: responsive.isLg },
    { name: 'XL', value: '1280px', active: responsive.isXl },
    { name: '2XL', value: '1536px', active: responsive.is2xl },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Responsive Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#00ff00' }}>Device Info</h4>
        {deviceInfo.map((info) => (
          <div key={info.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>{info.label}:</span>
            <span style={{ color: info.value === 'Yes' ? '#00ff00' : info.value === 'No' ? '#ff6b6b' : '#fff' }}>
              {info.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#00ff00' }}>Breakpoints</h4>
        {breakpoints.map((bp) => (
          <div key={bp.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>{bp.name}:</span>
            <span style={{ color: bp.active ? '#00ff00' : '#666' }}>
              {bp.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#00ff00' }}>Current Viewport</h4>
        <div style={{ fontSize: '10px', color: '#ccc' }}>
          <div>Viewport: {typeof window !== 'undefined' ? window.innerWidth : 0}x{typeof window !== 'undefined' ? window.innerHeight : 0}</div>
          <div>Device Pixel Ratio: {typeof window !== 'undefined' ? window.devicePixelRatio : 1}</div>
          <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('debug');
            window.location.href = url.toString();
          }}
          style={{
            background: '#0063b1',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('debug', 'responsive');
            window.location.href = url.toString();
          }}
          style={{
            background: '#28a745',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default ResponsiveTest;
