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
import { getSellerUrl } from '@/config';
import { CategoryAPI } from '@/app/api/category';
import { useRouter } from 'next/navigation';
import ResponsiveTest from '@/components/common/ResponsiveTest';

export default function Home() {
  const { initializeAuth } = useAuth();
  const router = useRouter();
  const [animatedSections, setAnimatedSections] = useState({
    banner: false,
    category: false,
    auction: false
  });
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State for dropdown menus
  const [auctionDropdownOpen, setAuctionDropdownOpen] = useState(false);
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);

  // State for category search
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Scroll functions
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleAuctionViewAll = () => {
    setAuctionDropdownOpen(false);
    scrollToSection('auction');
  };

  const handleTenderViewAll = () => {
    setTenderDropdownOpen(false);
    scrollToSection('tenders');
  };

  const handleCreateAuction = () => {
    setAuctionDropdownOpen(false);
    window.open(getSellerUrl(), '_blank');
  };

  const handleCreateTender = () => {
    setTenderDropdownOpen(false);
    window.open(getSellerUrl(), '_blank');
  };

  // Category search functions
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await CategoryAPI.getCategories();
      console.log('Categories API response:', response);
      if (response.success && response.data) {
        setCategories(response.data);
        console.log('Categories loaded:', response.data.length);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      const filtered = categories.filter((category: any) => 
        category.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleCategorySelect = (category: any) => {
    setSearchQuery(category.name);
    setShowSearchResults(false);
    
    // Debug: Log the category and URL
    console.log('Selected category:', category);
    
    // Navigate to category page (same as Explore Categories section)
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    const categoryUrl = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
    
    console.log('Navigating to:', categoryUrl);
    router.push(categoryUrl);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleCategorySelect(searchResults[0]);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdowns and search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside dropdown containers
      if (!target.closest('.dropdown-container')) {
        setAuctionDropdownOpen(false);
        setTenderDropdownOpen(false);
      }
      
      // Check if click is outside search results
      if (showSearchResults && 
          !target.closest('.search-container') && 
          !target.closest('.search-results')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

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
          --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 12%, #334155 24%, #1e3a8a 36%, #1e40af 48%, #2563eb 60%, #3b82f6 72%, #60a5fa 84%, #93c5fd 96%, #dbeafe 100%);
          --secondary-color: #0ea5e9;
          --accent-gradient: linear-gradient(135deg, #1e40af 0%, #2563eb 20%, #3b82f6 40%, #60a5fa 60%, #93c5fd 80%, #dbeafe 100%);
          --tertiary-gradient: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 25%, rgba(59, 130, 246, 0.6) 50%, rgba(147, 197, 253, 0.4) 75%, rgba(219, 234, 254, 0.2) 100%);
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
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes smoothGradient {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
        
        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes animatedGradient {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
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
            transform: translateY(0px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
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

        /* Animated Gradient Background */
        .animated-gradient {
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
        }

        .hero-overlay {
          animation: animatedGradient 12s ease infinite reverse;
        }

        /* Dropdown Menu Styles */
        .dropdown-container {
          position: relative;
          display: inline-block;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(147, 197, 253, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          z-index: 9999;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          visibility: hidden;
        }

        .dropdown-menu.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
          visibility: visible;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          color: white;
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(147, 197, 253, 0.1);
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }

        .dropdown-item svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .dropdown-arrow {
          transition: transform 0.3s ease;
        }

        .dropdown-button.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        /* Enhanced floating elements for gradient background */
        .hero-banner-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
           background: radial-gradient(
             circle at 30% 20%, 
             rgba(255, 255, 255, 0.08) 0%,
             rgba(219, 234, 254, 0.06) 15%,
             rgba(147, 197, 253, 0.04) 30%,
             rgba(96, 165, 250, 0.02) 45%,
             transparent 60%
           );
          animation: gentleFloat 25s ease-in-out infinite;
          z-index: 0;
        }

        .hero-banner-section::after {
          content: '';
          position: absolute;
          bottom: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
           background: radial-gradient(
             circle at 70% 80%, 
             rgba(30, 58, 138, 0.04) 0%,
             rgba(59, 130, 246, 0.03) 20%,
             rgba(96, 165, 250, 0.02) 40%,
             rgba(147, 197, 253, 0.01) 60%,
             transparent 80%
           );
          animation: gentleFloat 30s ease-in-out infinite reverse;
          z-index: 0;
        }

        /* Performance optimizations for animations */
        .hero-background,
        .hero-overlay,
        .floating-blob,
        .floating-card,
        .floating-particle {
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Enhanced Responsive Design */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Mobile performance optimizations */
        @media (max-width: 768px) {
          .hero-background {
            animation: none !important;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e40af 50%, #3b82f6 75%, #60a5fa 100%) !important;
          }
          
          .hero-overlay {
            animation: none !important;
          }
          
          .floating-blob,
          .floating-card,
          .floating-particle {
            animation: none !important;
          }
          
          .floating-elements {
            display: none !important;
          }
          
          .hero-banner-section::before,
          .hero-banner-section::after {
            animation: none !important;
            opacity: 0.3 !important;
          }
          
          .gradient-text {
            animation: none !important;
            background: none !important;
            color: white !important;
            -webkit-text-fill-color: white !important;
          }
        }
        
        /* Small mobile devices - further reduce animations */
        @media (max-width: 480px) {
          * {
            animation: none !important;
            transition: none !important;
          }
          
          .hero-background,
          .hero-overlay,
          .floating-blob,
          .floating-card,
          .floating-particle {
            animation: none !important;
            transition: none !important;
          }
        }
        
        /* Search input placeholder styles */
        input[placeholder="Rechercher par catégorie..."]::placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]::-webkit-input-placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]::-moz-placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]:-ms-input-placeholder {
          color: white !important;
          opacity: 0.8;
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
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
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
                      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)',
                      paddingTop: 'clamp(80px, 15vw, 120px)',
                      paddingBottom: 'clamp(40px, 8vw, 80px)',
                      width: '100%',
                      maxWidth: '100vw',
                      
                    }}
                  >
                    {/* Smooth Animated Gradient Background */}
                    <div 
                      className="hero-background"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                         background: `linear-gradient(
                          135deg,
                           #0f172a 0%,
                          #1e293b 25%,
                          #1e40af 50%,
                          #3b82f6 75%,
                          #60a5fa 100%
                        )`,
                        backgroundSize: '200% 200%',
                        animation: isMobile ? 'none' : 'smoothGradient 20s ease-in-out infinite',
                        zIndex: 1,
                      }}
                    />
                    
                    {/* Elegant Overlay */}
                    <div 
                      className="hero-overlay"
                      style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                         background: `linear-gradient(
                           135deg,
                          rgba(15, 23, 42, 0.7) 0%,
                          rgba(30, 41, 59, 0.5) 50%,
                          rgba(59, 130, 246, 0.3) 100%
                        )`,
                        zIndex: 2,
                        opacity: 0.8,
                      }}
                    />
                    
                    {/* Elegant Floating Elements */}
                    {!isMobile && (
                      <>
                        <div className="floating-blob" style={{
                      position: 'absolute',
                          top: '15%',
                          right: '10%',
                          width: '180px',
                          height: '180px',
                          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                          borderRadius: '50%',
                      zIndex: 1,
                          animation: 'gentleFloat 8s ease-in-out infinite',
                    }} />
                    
                        <div className="floating-blob" style={{
                      position: 'absolute',
                          bottom: '25%',
                          left: '8%',
                          width: '120px',
                          height: '120px',
                          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
                          borderRadius: '50%',
                      zIndex: 1,
                          animation: 'gentleFloat 12s ease-in-out infinite reverse',
                          animationDelay: '4s',
                    }} />
                      </>
                    )}

                    {/* Floating Elements with Simple Animations */}
                    <div className="floating-elements" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 2,
                      display: isMobile ? 'none' : 'block',
                    }}>
                      {/* Subtle Floating Particles */}
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div 
                          key={i}
                          className="floating-particle"
                          style={{
                            top: `${25 + i * 15}%`,
                            left: `${20 + i * 15}%`,
                            width: `${4 + i}px`,
                            height: `${4 + i}px`,
                            background: `rgba(147, 197, 253, 0.4)`,
                            borderRadius: '50%',
                            animationDelay: `${i * 2}s`,
                            animation: 'gentleFloat 6s ease-in-out infinite',
                          }}
                        />
                      ))}

                      <div className="floating-card" style={{
                        position: 'absolute',
                        top: '20%',
                        right: '15%',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        animation: 'gentleFloat 10s ease-in-out infinite',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(147, 197, 253, 0.6)',
                          animation: 'gentleFloat 4s ease-in-out infinite',
                        }} />
                      </div>
                      
                      <div className="floating-card" style={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '12%',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        animation: 'gentleFloat 8s ease-in-out infinite reverse',
                        animationDelay: '2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'rgba(96, 165, 250, 0.5)',
                          animation: 'gentleFloat 3s ease-in-out infinite',
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
                      {/* Category Search */}
                      <div 
                        className="search-container"
                        style={{
                          position: 'relative',
                          maxWidth: '500px',
                          margin: '0 auto 32px auto',
                          width: '100%',
                        }}
                      >
                        <form onSubmit={handleSearchSubmit}>
                          <div style={{
                            position: 'relative',
                            display: 'flex',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '50px',
                            padding: '4px',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          }}>
                            {/* Search Icon */}
                            <div style={{
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                              </svg>
                            </div>
                            
                            {/* Search Input */}
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Rechercher par catégorie..."
                              value={searchQuery}
                              onChange={handleSearchChange}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'white',
                          fontSize: '16px',
                                padding: '12px 0',
                                fontWeight: '500',
                              }}
                              onFocus={() => {
                                if (searchResults.length > 0) {
                                  setShowSearchResults(true);
                                }
                              }}
                            />
                            
                            {/* Search Button */}
                            {/* <button
                              type="submit"
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '12px 20px',
                                margin: '4px',
                          color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                          transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                              }}
                            >
                              Rechercher
                            </button> */}
                          </div>
                        </form>

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                          <div 
                            ref={searchResultsRef}
                            className="search-results"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              right: '0',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '16px',
                              marginTop: '8px',
                              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                              zIndex: 1000,
                              maxHeight: '300px',
                              overflowY: 'auto',
                            }}
                          >
                            {searchResults.map((category: any, index: number) => (
                              <div
                                key={category._id}
                                onClick={() => handleCategorySelect(category)}
                                style={{
                                  padding: '16px 20px',
                                  cursor: 'pointer',
                                  borderBottom: index < searchResults.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                                  transition: 'all 0.3s ease',
                                  color: '#1e293b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                  e.currentTarget.style.color = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#1e293b';
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                  <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                                <span style={{ fontWeight: '500' }}>{category.name}</span>
                                {category.description && (
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: '#64748b',
                                    marginLeft: 'auto',
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {category.description}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No Results Message */}
                        {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '16px',
                            marginTop: '8px',
                            padding: '20px',
                            textAlign: 'center',
                            color: '#64748b',
                            zIndex: 1000,
                          }}>
                            Aucune catégorie trouvée pour "{searchQuery}"
                          </div>
                        )}
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
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                          cursor: 'default',
                        }}
                      >
                        La première plateforme B2B innovante{' '}
                        <span style={{
                          color: 'white',
                          fontWeight: '900',
                        }}>
                          d'enchères et de soumissions
                        </span>
                        <br />
                        <span style={{
                          color: 'white',
                          fontWeight: '900',
                        }}>
                          en ligne
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
                        Découvrez Mazad Click, la première application B2B d'enchères et de soumissions dédiée aux entreprises algériennes.
                        <br /><br />
                        Une solution moderne pour acheter, vendre et collaborer plus vite, en toute transparence.
                        <br /><br />
                        Avec Mazad Click, accélérez vos opportunités et boostez votre business.
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
                        {/* Auctions Dropdown */}
                        <div className="dropdown-container">
                        <button
                            onClick={() => {
                              console.log('Auction button clicked, current state:', auctionDropdownOpen);
                              setAuctionDropdownOpen(!auctionDropdownOpen);
                            }}
                            className={`dropdown-button primary-cta ${auctionDropdownOpen ? 'open' : ''}`}
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
                            Auctions
                            <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>

                          <div 
                            className={`dropdown-menu ${auctionDropdownOpen ? 'open' : ''}`}
                            style={{
                              marginTop: '10px',
                              minWidth: '200px',
                              zIndex: 9999,
                              // Temporary debugging - remove this line
                              display: auctionDropdownOpen ? 'block' : 'none',
                            }}
                          >
                            <button className="dropdown-item" onClick={handleAuctionViewAll}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9,22 9,12 15,12 15,22"/>
                              </svg>
                              View All Auctions
                            </button>
                            <button className="dropdown-item" onClick={handleCreateAuction}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                              </svg>
                              Create Auction
                            </button>
                          </div>
                        </div>

                        {/* Tenders Dropdown */}
                        <div className="dropdown-container">
                        <button
                            onClick={() => {
                              console.log('Tender button clicked, current state:', tenderDropdownOpen);
                              setTenderDropdownOpen(!tenderDropdownOpen);
                            }}
                            className={`dropdown-button secondary-cta glass-morphism ${tenderDropdownOpen ? 'open' : ''}`}
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
                            Tenders
                            <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                          
                          <div 
                            className={`dropdown-menu ${tenderDropdownOpen ? 'open' : ''}`}
                            style={{
                              marginTop: '10px',
                              minWidth: '200px',
                              zIndex: 9999,
                              // Temporary debugging - remove this line
                              display: tenderDropdownOpen ? 'block' : 'none',
                            }}
                          >
                            <button className="dropdown-item" onClick={handleTenderViewAll}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9,22 9,12 15,12 15,22"/>
                              </svg>
                              View All Tenders
                            </button>
                            <button className="dropdown-item" onClick={handleCreateTender}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                              </svg>
                              Create Tender
                        </button>
                          </div>
                        </div>
                      </div>

                      {/* Trust Indicators */}
                      {/* <div 
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
                      </div> */}
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
                <ResponsiveTest />
              </AxiosInterceptor>
            </RequestProvider>
          </SnackbarProvider>
        </div>
      </SocketProvider>
    </>
  );
}