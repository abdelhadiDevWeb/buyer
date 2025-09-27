"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  originalX: number;
  originalY: number;
  angle: number;
  pulse: number;
}

interface Dot {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  phase: number;
}

interface GeometricShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'triangle' | 'square' | 'hexagon' | 'circle';
}

interface MousePosition {
  x: number;
  y: number;
}

interface InteractiveBackgroundProps {
  particleCount?: number;
  enableMouseTrail?: boolean;
  theme?: 'light' | 'dark' | 'gradient';
  enableDots?: boolean;
  enableGeometry?: boolean;
  enableWaves?: boolean;
}

const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({
  particleCount = 60,
  enableMouseTrail = true,
  theme = 'light',
  enableDots = true,
  enableGeometry = true,
  enableWaves = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const dotsRef = useRef<Dot[]>([]);
  const geometryRef = useRef<GeometricShape[]>([]);
  const mouseTrailRef = useRef<MousePosition[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Enhanced theme configurations
  const themeConfig = {
    light: {
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 50%, rgba(255, 255, 255, 0.85) 100%)',
      particleColor: [99, 102, 241], // Blue
      trailColor: [99, 102, 241, 0.4],
      waveColor: [99, 102, 241, 0.06],
      dotColors: ['rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.6)'],
      geometryColor: [99, 102, 241, 0.15],
      connectionColor: [99, 102, 241, 0.2]
    },
    dark: {
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(51, 65, 85, 0.85) 100%)',
      particleColor: [139, 92, 246], // Purple
      trailColor: [139, 92, 246, 0.5],
      waveColor: [139, 92, 246, 0.08],
      dotColors: ['rgba(139, 92, 246, 0.9)', 'rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.7)'],
      geometryColor: [139, 92, 246, 0.2],
      connectionColor: [139, 92, 246, 0.25]
    },
    gradient: {
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.15) 30%, rgba(59, 130, 246, 0.12) 60%, rgba(168, 85, 247, 0.1) 100%)',
      particleColor: [59, 130, 246],
      trailColor: [59, 130, 246, 0.4],
      waveColor: [59, 130, 246, 0.08],
      dotColors: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.7)', 'rgba(168, 85, 247, 0.6)'],
      geometryColor: [59, 130, 246, 0.18],
      connectionColor: [59, 130, 246, 0.22]
    }
  };

  const currentTheme = themeConfig[theme];

  // Initialize particles with enhanced properties
  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        originalX: x,
        originalY: y,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.6 + 0.3,
        hue: Math.random() * 60 + 200,
        angle: Math.random() * Math.PI * 2,
        pulse: Math.random() * Math.PI * 2
      });
    }
    particlesRef.current = particles;
  };

  // Initialize dots network
  const initDots = (width: number, height: number) => {
    const dots: Dot[] = [];
    const dotCount = Math.floor((width * height) / 15000); // Responsive dot count
    
    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 6 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        color: currentTheme.dotColors[Math.floor(Math.random() * currentTheme.dotColors.length)],
        pulseSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }
    dotsRef.current = dots;
  };

  // Initialize geometric shapes
  const initGeometry = (width: number, height: number) => {
    const shapes: GeometricShape[] = [];
    const shapeCount = Math.floor((width * height) / 25000); // Responsive shape count
    const types: GeometricShape['type'][] = ['triangle', 'square', 'hexagon', 'circle'];
    
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 40 + 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.3 + 0.1,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    geometryRef.current = shapes;
  };

  // Enhanced particle updates with more dynamic behavior
  const updateParticles = (width: number, height: number, mouseX: number, mouseY: number, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      // Enhanced mouse interaction
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 200;

      if (distance < maxDistance && distance > 0) {
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);
        particle.speedX -= Math.cos(angle) * force * 0.015;
        particle.speedY -= Math.sin(angle) * force * 0.015;
      }

      // Add subtle orbital motion
      particle.angle += 0.01;
      particle.pulse += 0.02;
      
      const orbitalForce = Math.sin(particle.pulse) * 0.3;
      particle.x += particle.speedX + Math.cos(particle.angle) * orbitalForce;
      particle.y += particle.speedY + Math.sin(particle.angle) * orbitalForce;

      // Boundary check with bounce effect
      if (particle.x < 0 || particle.x > width) {
        particle.speedX *= -0.8;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y < 0 || particle.y > height) {
        particle.speedY *= -0.8;
        particle.y = Math.max(0, Math.min(height, particle.y));
      }

      // Enhanced friction and size pulsing
      particle.speedX *= 0.985;
      particle.speedY *= 0.985;
      
      // Dynamic opacity and size based on time
      particle.opacity = 0.3 + Math.sin(time * 0.001 + index) * 0.3;
      particle.size = 2 + Math.sin(particle.pulse) * 1.5;
    });
  };

  // Update dots with pulsing effect
  const updateDots = (time: number) => {
    dotsRef.current.forEach(dot => {
      dot.phase += dot.pulseSpeed;
      dot.opacity = 0.3 + Math.sin(dot.phase) * 0.5;
      dot.size = 3 + Math.sin(dot.phase * 1.5) * 2;
    });
  };

  // Update geometric shapes with rotation
  const updateGeometry = (time: number) => {
    geometryRef.current.forEach(shape => {
      shape.rotation += shape.rotationSpeed;
      shape.opacity = 0.1 + Math.sin(time * 0.001 + shape.x * 0.01) * 0.2;
    });
  };

  // Enhanced wave effect with multiple layers
  const drawWaves = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (!enableWaves) return;
    
    // Primary wave
    const gradient1 = ctx.createLinearGradient(0, 0, width, height);
    gradient1.addColorStop(0, `rgba(${currentTheme.waveColor[0]}, ${currentTheme.waveColor[1]}, ${currentTheme.waveColor[2]}, ${currentTheme.waveColor[3]})`);
    gradient1.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient1;
    ctx.beginPath();
    
    const amplitude1 = 40;
    const frequency1 = 0.008;
    
    ctx.moveTo(0, height * 0.6);
    for (let x = 0; x <= width; x += 4) {
      const y = height * 0.6 + Math.sin(x * frequency1 + time * 0.001) * amplitude1;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Secondary wave
    const gradient2 = ctx.createLinearGradient(0, 0, width, height);
    gradient2.addColorStop(0, `rgba(${currentTheme.waveColor[0]}, ${currentTheme.waveColor[1]}, ${currentTheme.waveColor[2]}, ${currentTheme.waveColor[3] * 0.5})`);
    gradient2.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient2;
    ctx.beginPath();
    
    const amplitude2 = 25;
    const frequency2 = 0.012;
    
    ctx.moveTo(0, height * 0.7);
    for (let x = 0; x <= width; x += 6) {
      const y = height * 0.7 + Math.sin(x * frequency2 + time * 0.0015) * amplitude2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  };

  // Draw dots with connections
  const drawDots = (ctx: CanvasRenderingContext2D) => {
    if (!enableDots) return;
    
    // Draw connecting lines first (behind dots)
    dotsRef.current.forEach((dot, i) => {
      dotsRef.current.slice(i + 1).forEach(otherDot => {
        const dx = dot.x - otherDot.x;
        const dy = dot.y - otherDot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = (120 - distance) / 120 * 0.3;
          ctx.strokeStyle = `rgba(${currentTheme.connectionColor[0]}, ${currentTheme.connectionColor[1]}, ${currentTheme.connectionColor[2]}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(otherDot.x, otherDot.y);
          ctx.stroke();
        }
      });
    });

    // Draw dots
    dotsRef.current.forEach(dot => {
      const gradient = ctx.createRadialGradient(
        dot.x, dot.y, 0,
        dot.x, dot.y, dot.size
      );
      gradient.addColorStop(0, dot.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add inner glow
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Draw geometric shapes
  const drawGeometry = (ctx: CanvasRenderingContext2D) => {
    if (!enableGeometry) return;
    
    geometryRef.current.forEach(shape => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = shape.opacity;
      
      const gradient = ctx.createLinearGradient(-shape.size/2, -shape.size/2, shape.size/2, shape.size/2);
      gradient.addColorStop(0, `rgba(${currentTheme.geometryColor[0]}, ${currentTheme.geometryColor[1]}, ${currentTheme.geometryColor[2]}, ${currentTheme.geometryColor[3]})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = `rgba(${currentTheme.geometryColor[0]}, ${currentTheme.geometryColor[1]}, ${currentTheme.geometryColor[2]}, ${currentTheme.geometryColor[3] * 2})`;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      
      switch (shape.type) {
        case 'triangle':
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.closePath();
          break;
          
        case 'square':
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
          break;
          
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * shape.size / 2;
            const y = Math.sin(angle) * shape.size / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          break;
          
        case 'circle':
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          break;
      }
      
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  };

  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      gradient.addColorStop(0, `rgba(${currentTheme.particleColor[0]}, ${currentTheme.particleColor[1]}, ${currentTheme.particleColor[2]}, ${particle.opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw connections
      particlesRef.current.forEach(otherParticle => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100 && distance > 0) {
          const opacity = (100 - distance) / 100 * 0.1;
          ctx.strokeStyle = `rgba(${currentTheme.particleColor[0]}, ${currentTheme.particleColor[1]}, ${currentTheme.particleColor[2]}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      });
    });
  };

  // Draw mouse trail
  const drawMouseTrail = (ctx: CanvasRenderingContext2D) => {
    if (!enableMouseTrail || mouseTrailRef.current.length < 2) return;

    ctx.strokeStyle = `rgba(${currentTheme.trailColor[0]}, ${currentTheme.trailColor[1]}, ${currentTheme.trailColor[2]}, ${currentTheme.trailColor[3]})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < mouseTrailRef.current.length - 1; i++) {
      const point = mouseTrailRef.current[i];
      const nextPoint = mouseTrailRef.current[i + 1];
      const opacity = i / mouseTrailRef.current.length;
      
      ctx.globalAlpha = opacity * 0.5;
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // Enhanced animation loop with all effects
  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with subtle gradient overlay
    ctx.clearRect(0, 0, width, height);

    // Draw background waves
    if (enableWaves) {
      drawWaves(ctx, width, height, time);
    }

    // Draw geometric shapes (behind everything)
    if (enableGeometry) {
      updateGeometry(time);
      drawGeometry(ctx);
    }

    // Draw dots network
    if (enableDots) {
      updateDots(time);
      drawDots(ctx);
    }

    // Update and draw particles
    updateParticles(width, height, mouseRef.current.x, mouseRef.current.y, time);
    drawParticles(ctx);

    // Draw mouse trail (on top)
    if (enableMouseTrail) {
      drawMouseTrail(ctx);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y };

    // Add to trail
    if (enableMouseTrail) {
      mouseTrailRef.current.push({ x, y });
      if (mouseTrailRef.current.length > 20) {
        mouseTrailRef.current.shift();
      }
    }
  };

  // Handle resize with all elements
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reinitialize all elements
    initParticles(canvas.width, canvas.height);
    if (enableDots) initDots(canvas.width, canvas.height);
    if (enableGeometry) initGeometry(canvas.width, canvas.height);
  };

  // Handle visibility change for performance
  const handleVisibilityChange = () => {
    setIsVisible(!document.hidden);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size and DPI scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Initialize all elements
    initParticles(canvas.width / dpr, canvas.height / dpr);
    if (enableDots) initDots(canvas.width / dpr, canvas.height / dpr);
    if (enableGeometry) initGeometry(canvas.width / dpr, canvas.height / dpr);

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, enableDots, enableGeometry, enableWaves, theme]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: currentTheme.background,
          zIndex: -2,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </>
  );
};

export default InteractiveBackground;
