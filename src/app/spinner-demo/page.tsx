"use client";
import React, { useState } from 'react';
import ModernSpinner from '@/components/common/ModernSpinner';
import PageLoader from '@/components/common/PageLoader';

const SpinnerDemo = () => {
  const [selectedVariant, setSelectedVariant] = useState<'orbit' | 'pulse' | 'wave' | 'dots' | 'ripple' | 'cube' | 'flower'>('orbit');
  const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [selectedColor, setSelectedColor] = useState<'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white'>('primary');
  const [customText, setCustomText] = useState('Loading...');
  const [showFullScreen, setShowFullScreen] = useState(false);

  const variants = [
    { key: 'orbit', name: 'Orbit', description: 'Dual rotating circles' },
    { key: 'pulse', name: 'Pulse', description: 'Multi-layered pulsing circles' },
    { key: 'wave', name: 'Wave', description: 'Animated wave bars' },
    { key: 'dots', name: 'Dots', description: 'Bouncing dots' },
    { key: 'ripple', name: 'Ripple', description: 'Expanding ripple effect' },
    { key: 'cube', name: 'Cube', description: '3D rotating cube' },
    { key: 'flower', name: 'Flower', description: 'Flower petal animation' }
  ];

  const sizes = [
    { key: 'sm', name: 'Small' },
    { key: 'md', name: 'Medium' },
    { key: 'lg', name: 'Large' },
    { key: 'xl', name: 'Extra Large' }
  ];

  const colors = [
    { key: 'primary', name: 'Primary', color: '#0063b1' },
    { key: 'secondary', name: 'Secondary', color: '#6b7280' },
    { key: 'success', name: 'Success', color: '#10b981' },
    { key: 'warning', name: 'Warning', color: '#f59e0b' },
    { key: 'error', name: 'Error', color: '#ef4444' },
    { key: 'white', name: 'White', color: '#ffffff' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0063b1 0%, #2453D4 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            marginBottom: '10px',
            fontWeight: '700'
          }}>
            Modern Spinner Gallery
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Explore our collection of beautiful, animated loading spinners with modern UI design
          </p>
        </div>

        {/* Controls */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '40px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Customize Your Spinner</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Variant Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Animation Variant
              </label>
              <select 
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {variants.map(variant => (
                  <option key={variant.key} value={variant.key}>
                    {variant.name} - {variant.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Size
              </label>
              <select 
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {sizes.map(size => (
                  <option key={size.key} value={size.key}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Color
              </label>
              <select 
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {colors.map(color => (
                  <option key={color.key} value={color.key}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Text */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Custom Text
              </label>
              <input 
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter loading text..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>

          {/* Full Screen Toggle */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowFullScreen(!showFullScreen)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: showFullScreen ? '#ef4444' : '#0063b1',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {showFullScreen ? 'Hide Full Screen' : 'Show Full Screen'}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '30px', color: '#333' }}>Live Preview</h2>
          <ModernSpinner
            variant={selectedVariant}
            size={selectedSize}
            color={selectedColor}
            text={customText}
          />
        </div>

        {/* All Variants Gallery */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          marginTop: '40px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '30px', color: '#333', textAlign: 'center' }}>
            All Animation Variants
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '30px' 
          }}>
            {variants.map(variant => (
              <div key={variant.key} style={{
                textAlign: 'center',
                padding: '20px',
                borderRadius: '15px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                backgroundColor: selectedVariant === variant.key ? '#f0f9ff' : 'white'
              }}
              onClick={() => setSelectedVariant(variant.key as any)}
              >
                <ModernSpinner
                  variant={variant.key as any}
                  size="md"
                  color="primary"
                />
                <h3 style={{ marginTop: '15px', fontSize: '16px', color: '#333' }}>
                  {variant.name}
                </h3>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginTop: '5px',
                  lineHeight: '1.4'
                }}>
                  {variant.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Screen Demo */}
      {showFullScreen && (
        <PageLoader
          variant={selectedVariant}
          size={selectedSize}
          color={selectedColor}
          text={customText}
          fullScreen={true}
        />
      )}
    </div>
  );
};

export default SpinnerDemo;
