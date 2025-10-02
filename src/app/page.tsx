"use client";

import Header from "@/components/header/Header"
import Home1Banner from "@/components/banner/Home1Banner";
import Home1LiveAuction from "@/components/live-auction/Home1LiveAuction";
import Home1LiveTenders from "@/components/live-tenders/Home1LiveTenders";
import Home1Category from "@/components/category/Home1Category";
import ProfessionalAuctions from "@/components/professional-auctions/ProfessionalAuctions";
import Footer from "@/components/footer/FooterWithErrorBoundary";
import RequestProvider from "@/contexts/RequestContext";

import { useEffect, useState, useRef } from "react";
import { SnackbarProvider, useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import './style.css'
import SocketProvider from "@/contexts/socket";
import { useCreateSocket } from '@/contexts/socket';

export default function Home() {
  const { initializeAuth } = useAuth();
  const [animatedSections, setAnimatedSections] = useState({
    banner: false,
    category: false,
    auction: false
  });

  // Refs for scroll animations
  const bannerRef = useRef(null);
  const categoryRef = useRef(null);
  const auctionRef = useRef(null);



  // Snackbar for socket errors
  const { enqueueSnackbar } = useSnackbar();
  const socketContext = useCreateSocket();
  const socketError = socketContext?.socketError;
  const setSocketError = socketContext?.setSocketError;

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);



  useEffect(() => {
    if (socketError) {
      enqueueSnackbar(socketError, { variant: 'error' });
      if (setSocketError) {
        setSocketError(null);
      }
    }
  }, [socketError, enqueueSnackbar, setSocketError]);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            setAnimatedSections(prev => ({
              ...prev,
              [sectionId]: true
            }));
          }
        }
      });
    }, observerOptions);

    // Observe sections
    if (bannerRef.current) observer.observe(bannerRef.current);
    if (categoryRef.current) observer.observe(categoryRef.current);
    if (auctionRef.current) observer.observe(auctionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Global styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Hero Banner Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        .hero-banner-section {
          position: relative;
          overflow: hidden;
        }

        .hero-background {
          transition: transform 0.1s ease-out;
        }

        .floating-card {
          animation: float 6s ease-in-out infinite;
        }

        .floating-card:nth-child(2) {
          animation-delay: -3s;
        }

        /* Mouse tracking effect */
        .hero-background:hover {
          transform: scale(1.05) translate(var(--mouse-x, 0px), var(--mouse-y, 0px));
        }
        
        :root {
          --primary-color: #1e40af;
          --primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          --secondary-color: #0ea5e9;
          --accent-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%);
          --text-color: #1f2937;
          --bg-color: #ffffff;
          --accent-color: #f8fafc;
          --shadow-sm: 0 2px 8px rgba(30, 64, 175, 0.08);
          --shadow-md: 0 4px 20px rgba(30, 64, 175, 0.12);
          --shadow-lg: 0 8px 30px rgba(30, 64, 175, 0.16);
          --shadow-xl: 0 12px 40px rgba(30, 64, 175, 0.2);
          --transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --transition-fast: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --border-radius: 16px;
          --border-radius-lg: 24px;
          --border-radius-xl: 32px;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          overflow-x: hidden;
          scroll-behavior: smooth;
          width: 100%;
          max-width: 100vw;
          margin: 0;
          padding: 0;
        }
        
        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          overflow-x: hidden;
        }
        
        /* Enhanced Animation Keyframes */
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes morphBlob {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            border-radius: 50% 40% 60% 30% / 70% 50% 40% 60%;
            transform: rotate(180deg) scale(0.9);
          }
          75% {
            border-radius: 40% 70% 50% 60% / 30% 40% 60% 50%;
            transform: rotate(270deg) scale(1.05);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes magneticPull {
          0% {
            transform: translate(0, 0) scale(1);
          }
          100% {
            transform: translate(var(--mouse-pull-x, 0), var(--mouse-pull-y, 0)) scale(1.05);
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.6;
          }
          25% {
            transform: translate(10px, -10px) rotate(90deg);
            opacity: 1;
          }
          50% {
            transform: translate(-5px, -20px) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(-10px, -5px) rotate(270deg);
            opacity: 0.9;
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(0, 99, 177, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        

        
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes rotateIn {
          from {
            opacity: 0;
            transform: rotate(-200deg);
          }
          to {
            opacity: 1;
            transform: rotate(0);
          }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes flipInX {
          from {
            opacity: 0;
            transform: perspective(400px) rotateX(90deg);
          }
          40% {
            transform: perspective(400px) rotateX(-20deg);
          }
          60% {
            transform: perspective(400px) rotateX(10deg);
          }
          80% {
            transform: perspective(400px) rotateX(-5deg);
          }
          to {
            opacity: 1;
            transform: perspective(400px) rotateX(0deg);
          }
        }
        
        @keyframes lightSpeedIn {
          from {
            opacity: 0;
            transform: translate3d(100%, 0, 0) skewX(-30deg);
          }
          60% {
            opacity: 1;
            transform: translate3d(-20%, 0, 0) skewX(30deg);
          }
          80% {
            transform: translate3d(0%, 0, 0) skewX(-15deg);
          }
          to {
            opacity: 1;
            transform: translate3d(0%, 0, 0) skewX(0deg);
          }
        }
        
        /* Enhanced Utility classes */
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slide-left {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-slide-right {
          animation: slideInRight 0.8s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        

        
        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slideInUp 0.8s ease-out;
        }
        
        .animate-rotate-in {
          animation: rotateIn 0.8s ease-out;
        }
        
        .animate-zoom-in {
          animation: zoomIn 0.8s ease-out;
        }
        
        .animate-flip-in {
          animation: flipInX 0.8s ease-out;
        }
        
        .animate-light-speed {
          animation: lightSpeedIn 0.8s ease-out;
        }
        
        .section-spacing {
          margin-bottom: 0;
          position: relative;
        }
        
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 99, 177, 0.1), transparent);
          margin: 40px 0;
        }
        
        .text-gradient {
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          transition: var(--transition);
          cursor: pointer;
          border: none;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }
        
        .btn-primary {
          background: var(--primary-gradient);
          background-size: 200% 200%;
          color: white;
          box-shadow: var(--shadow-md);
          position: relative;
          overflow: hidden;
          animation: gradientShift 3s ease infinite;
        }
        
        .btn-primary:hover {
          box-shadow: var(--shadow-xl);
          transform: translateY(-4px) scale(1.02);
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }

        .btn-primary:hover::after {
          left: 100%;
        }
        
        .btn-light {
          background: white;
          color: var(--text-color);
          box-shadow: var(--shadow-sm);
        }
        
        .card {
          background: white;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-5px);
          border-color: rgba(0, 99, 177, 0.1);
        }
        
        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        /* Scroll animations */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.6s ease;
        }
        
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Staggered animations */
        .stagger-item {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }
        
        .stagger-item.animate {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Enhanced responsive design */
        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }
          
          .section-spacing {
            margin-bottom: 40px;
          }
          
          /* Hero section responsive styles */
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          
          .hero-trust-indicators {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .hero-cta-buttons {
            flex-direction: column !important;
            align-items: center;
          }
          
          .hero-feature-card {
            margin: 0 auto !important;
            max-width: 320px !important;
          }
        }
        
        @media (max-width: 1024px) {
          .hero-floating-elements {
            display: none;
          }
        }
        
        /* Modern scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--primary-gradient);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #004a8c, #007bb8);
        }
        
        /* Page transition effects */
        .page-transition {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        /* Improved focus styles */
        *:focus {
          outline: 2px solid rgba(0, 99, 177, 0.5);
          outline-offset: 2px;
        }
        
        /* Modern section backgrounds */
        .section-bg-1 {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .section-bg-2 {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .section-bg-3 {
          background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%);
        }
        
        /* Animation delays for staggered effects */
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        
        /* Parallax effect */
        .parallax-bg {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        
        /* Glow effects */
        .glow-effect {
          position: relative;
        }
        
        .glow-effect::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #0063b1, #00a3e0, #0063b1);
          border-radius: inherit;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .glow-effect:hover::before {
          opacity: 1;
        }

        /* Simple Interactive Effects */

        .glass-morphism {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .gradient-text {
          background: var(--primary-gradient);
          background-size: 200% 200%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
        }

        .floating-particle {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          animation: particleFloat 8s ease-in-out infinite;
        }

        .morphing-blob {
          animation: morphBlob 20s ease-in-out infinite;
          background: var(--accent-gradient);
          opacity: 0.7;
          filter: blur(1px);
        }

        .interactive-card {
          transition: var(--transition);
        }

        .interactive-card:hover {
          transform: translateY(-4px) scale(1.02);
        }

        /* Enhanced Responsive Design */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      
      <SocketProvider >
        <div>
          {/* {show && <Chat setShow={setShow} check={check} setCheck={setCheck}/>} */}
          <SnackbarProvider 
            maxSnack={3} 
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            style={{ borderRadius: '10px' }}
          >
            <RequestProvider>
              <AxiosInterceptor>
                <Header />
                <main style={{ 
                  minHeight: '100vh', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100vw',
                  overflowX: 'hidden',
                }}>
                  {/* Hero Banner Section */}
                  <section 
                    ref={bannerRef}
                    data-section="banner"
                    className="hero-banner-section"
                    style={{ 
                      minHeight: '100vh',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '80px 20px',
                      paddingTop: '120px',
                      paddingBottom: '80px',
                      width: '100%',
                      maxWidth: '100vw',
                    }}
                  >
                    {/* Background Image */}
                    <div 
                      className="hero-background"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'url("/assets/images/mainImage.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transform: 'scale(1.05)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    
                    {/* Overlay with Blue Accents */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, 
                        rgba(30, 64, 175, 0.9) 0%, 
                        rgba(59, 130, 246, 0.7) 25%,
                        rgba(0, 0, 0, 0.6) 50%, 
                        rgba(29, 78, 216, 0.8) 75%,
                        rgba(30, 58, 138, 0.9) 100%)`,
                      zIndex: 1,
                    }} />
                    
                    {/* Floating Morphing Blobs */}
                    <div className="morphing-blob" style={{
                      position: 'absolute',
                      top: '10%',
                      right: '15%',
                      width: '200px',
                      height: '200px',
                      zIndex: 1,
                      opacity: 0.3,
                    }} />
                    
                    <div className="morphing-blob" style={{
                      position: 'absolute',
                      bottom: '20%',
                      left: '10%',
                      width: '150px',
                      height: '150px',
                      zIndex: 1,
                      opacity: 0.2,
                      animationDelay: '10s',
                    }} />

                    {/* Floating Elements with Simple Animations */}
                    <div className="floating-elements" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}>
                      {/* Floating Particles */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div 
                          key={i}
                          className="floating-particle"
                          style={{
                            top: `${20 + i * 12}%`,
                            left: `${15 + i * 10}%`,
                            width: `${6 + i * 2}px`,
                            height: `${6 + i * 2}px`,
                            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(147, 197, 253, 0.4))`,
                            animationDelay: `${i * 1}s`,
                          }}
                        />
                      ))}

                      <div className="floating-card glass-morphism" style={{
                        position: 'absolute',
                        top: '15%',
                        right: '10%',
                        width: '140px',
                        height: '90px',
                        borderRadius: '20px',
                        animation: 'float 6s ease-in-out infinite',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 197, 253, 0.1))',
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--primary-gradient)',
                          animation: 'pulse 2s infinite',
                        }} />
                      </div>
                      
                      <div className="floating-card glass-morphism" style={{
                        position: 'absolute',
                        bottom: '20%',
                        left: '8%',
                        width: '110px',
                        height: '70px',
                        borderRadius: '16px',
                        animation: 'float 8s ease-in-out infinite reverse',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.2), rgba(59, 130, 246, 0.1))',
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--accent-gradient)',
                          animation: 'spin 3s linear infinite',
                        }} />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="hero-content" style={{
                      position: 'relative',
                      zIndex: 3,
                      maxWidth: '1400px',
                      margin: '0 auto',
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'white',
                      width: '100%',
                      overflowX: 'hidden',
                    }}>
                      {/* Trust Badge */}
                      <div 
                        className="trust-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '50px',
                          padding: '12px 24px',
                          marginBottom: '32px',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'white',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L15.09 8.26L23 9L17 14.74L18.18 22.5L12 19.77L5.82 22.5L7 14.74L1 9L8.91 8.26L12 1Z"/>
                        </svg>
                        Trusted by 5,000+ Business Partners
                      </div>

                      {/* Enhanced Main Headline */}
                      <h1 
                        className="hero-headline"
                        style={{
                          fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                          fontWeight: '900',
                          lineHeight: '1.1',
                          marginBottom: '32px',
                          marginTop: '32px',
                          color: 'white',
                          textShadow: '0 4px 20px rgba(30, 64, 175, 0.6), 0 8px 40px rgba(59, 130, 246, 0.4)',
                          cursor: 'default',
                        }}
                      >
                        Professional{' '}
                        <span className="gradient-text" style={{
                          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 25%, #1d4ed8 50%, #1e3a8a 75%, #312e81 100%)',
                          backgroundSize: '300% 300%',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          position: 'relative',
                          display: 'inline-block',
                          animation: 'gradientShift 4s ease infinite',
                        }}>
                          Auction Platform
                        </span>
                        <br />
                        <span style={{
                          background: 'linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          For Business Excellence
                        </span>
                      </h1>

                      {/* Subtitle */}
                      <p 
                        className="hero-subtitle"
                        style={{
                          fontSize: '1.4rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: '1.6',
                          marginBottom: '48px',
                          marginTop: '24px',
                          maxWidth: '700px',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                          padding: '0 20px',
                        }}
                      >
                        Access premium business assets, participate in professional auctions, and secure strategic acquisitions from verified enterprise sellers in our secure B2B marketplace.
                      </p>

                      {/* CTA Buttons */}
                      <div 
                        className="hero-cta-buttons"
                        style={{
                          display: 'flex',
                          gap: '24px',
                          marginBottom: '64px',
                          marginTop: '32px',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          padding: '0 20px',
                        }}
                      >
                        <button
                          onClick={() => window.location.href = '/auction-sidebar'}
                          className="primary-cta"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'var(--primary-gradient)',
                            backgroundSize: '200% 200%',
                            color: 'white',
                            padding: '20px 40px',
                            borderRadius: '50px',
                            border: 'none',
                            fontSize: '18px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-lg)',
                            transition: 'var(--transition)',
                            position: 'relative',
                            overflow: 'hidden',
                            animation: 'gradientShift 3s ease infinite',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
                          </svg>
                          Access Platform
                        </button>

                        <button
                          onClick={() => window.location.href = '/how-to-bid'}
                          className="secondary-cta glass-morphism"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            color: 'white',
                            padding: '20px 36px',
                            borderRadius: '50px',
                            border: '2px solid rgba(147, 197, 253, 0.3)',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.09 0 2.13.2 3.1.56"/>
                            <path d="M21 3l-6 6-4-4"/>
                          </svg>
                          Learn Process
                        </button>
                      </div>

                      {/* Trust Indicators */}
                      <div 
                        className="hero-trust-indicators"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '32px',
                          maxWidth: '1000px',
                          margin: '0 auto',
                          marginTop: '48px',
                          padding: '0 20px',
                        }}
                      >
                        {[
                          {
                            icon: 'M12 1L15.09 8.26L23 9L17 14.74L18.18 22.5L12 19.77L5.82 22.5L7 14.74L1 9L8.91 8.26L12 1Z',
                            title: 'Premium Assets',
                            description: 'Access exclusive business assets and investments'
                          },
                          {
                            icon: 'M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.09 0 2.13.2 3.1.56',
                            title: 'Secure Platform',
                            description: 'Enterprise-grade security and verification'
                          },
                          {
                            icon: 'M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.6 1.53c.56-1.24.9-2.62.9-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z',
                            title: '24/7 Support',
                            description: 'Professional assistance whenever you need it'
                          }
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="trust-indicator glass-morphism"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '20px',
                              padding: '24px',
                              borderRadius: '20px',
                              transition: 'var(--transition)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.currentTarget.style.boxShadow = '0 16px 40px rgba(59, 130, 246, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                          >
                            <div style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '20px',
                              background: 'var(--accent-gradient)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: 'var(--shadow-md)',
                              animation: 'pulse 3s ease infinite',
                            }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                <path d={item.icon}/>
                              </svg>
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '4px',
                              }}>
                                {item.title}
                              </h3>
                              <p style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                lineHeight: '1.4',
                              }}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                  
                  {/* Section Divider with Animation */}
                  <div 
                    className="section-divider"
                    style={{
                      opacity: animatedSections.banner ? 1 : 0,
                      transform: animatedSections.banner ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'all 0.6s ease-out 0.3s',
                    }}
                  ></div>
                  
                  {/* Categories Section */}
                  <section 
                    ref={categoryRef}
                    data-section="category"
                    className={`section-spacing section-bg-2 ${animatedSections.category ? 'animate-slide-left' : ''}`}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      opacity: animatedSections.category ? 1 : 0,
                      transform: animatedSections.category ? 'translateX(0)' : 'translateX(-50px)',
                      transition: 'all 0.8s ease-out',
                    }}
                  >
                    <Home1Category />
                  </section>
                  
                  {/* Section Divider with Animation */}
                  <div 
                    className="section-divider"
                    style={{
                      opacity: animatedSections.category ? 1 : 0,
                      transform: animatedSections.category ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'all 0.6s ease-out 0.3s',
                    }}
                  ></div>
                  
                  {/* Professional Auctions Section - Only for Professional Users */}
                  <section 
                    data-section="professional"
                    className="section-spacing section-bg-1"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <ProfessionalAuctions />
                  </section>
                  
                  {/* Section Divider with Animation */}
                  <div 
                    className="section-divider"
                    style={{
                      opacity: 1,
                      transform: 'scaleX(1)',
                      transition: 'all 0.6s ease-out 0.3s',
                    }}
                  ></div>
                  
                  {/* Live Auctions Section */}
                  <section 
                    ref={auctionRef}
                    data-section="auction"
                    className={`section-spacing section-bg-3 ${animatedSections.auction ? 'animate-slide-right' : ''}`}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      opacity: animatedSections.auction ? 1 : 0,
                      transform: animatedSections.auction ? 'translateX(0)' : 'translateX(50px)',
                      transition: 'all 0.8s ease-out',
                    }}
                  >
                    <Home1LiveAuction />
                  </section>
                  
                  {/* Section Divider with Animation */}
                  <div 
                    className="section-divider"
                    style={{
                      opacity: animatedSections.auction ? 1 : 0,
                      transform: animatedSections.auction ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'all 0.6s ease-out 0.3s',
                    }}
                  ></div>
                  
                  {/* Live Tenders Section */}
                  <section 
                    data-section="tenders"
                    className="section-spacing section-bg-1"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <Home1LiveTenders />
                  </section>
                  
                  {/* Enhanced Decorative Elements */}
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '10%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(0, 99, 177, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 6s ease-in-out infinite',
                    opacity: animatedSections.banner ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.5s',
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '5%',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(0, 163, 224, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 8s ease-in-out infinite reverse',
                    opacity: animatedSections.category ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.8s',
                  }}></div>
                  
                  {/* Additional floating elements */}
                  <div style={{
                    position: 'absolute',
                    top: '60%',
                    right: '5%',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(255, 165, 0, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 10s ease-in-out infinite',
                    opacity: animatedSections.auction ? 1 : 0,
                    transition: 'opacity 1s ease-out 1s',
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '15%',
                    width: '80px',
                    height: '80px',
                    background: 'radial-gradient(circle, rgba(0, 99, 177, 0.03) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 7s ease-in-out infinite reverse',
                    opacity: animatedSections.banner ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.7s',
                  }}></div>
                </main>
                <Footer />
              </AxiosInterceptor>
            </RequestProvider>
          </SnackbarProvider>
        </div>
      </SocketProvider>
    </>
  );
}