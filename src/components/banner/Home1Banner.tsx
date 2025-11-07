"use client";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard, FreeMode, Autoplay } from "swiper/modules";
import { CategoryAPI } from '@/app/api/category';
import app from '@/config';
import { FaShoppingBag, FaHandshake } from 'react-icons/fa';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const DEV_BACKEND_HOST = 'http://localhost:3000';
const PROD_BACKEND_HOST = 'https://mazadclick-server.onrender.com';
// const LEGACY_BACKEND_HOST = 'http://localhost:3000';

const resolveBackendHost = () => (process.env.NODE_ENV === 'development' ? DEV_BACKEND_HOST : PROD_BACKEND_HOST);

type Home1BannerProps = object;

const Home1Banner: React.FC<Home1BannerProps> = () => {
  const { t } = useTranslation();
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await CategoryAPI.getCategories();
        if (response.success && response.data) {
          setAllCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on selected type
  const categories = useMemo(() => {
    if (filterType === 'ALL') {
      return allCategories;
    }
    return allCategories.filter(category => {
      const categoryType = category.type?.toUpperCase();
      return categoryType === filterType;
    });
  }, [allCategories, filterType]);

  const getCategoryImageUrl = (category: any): string => {
    // Try to get image from thumb.url, thumb.fullUrl, or other possible fields
    const imageUrl = category.thumb?.url || 
                     category.thumb?.fullUrl || 
                     category.image || 
                     category.thumbnail || 
                     category.photo || 
                     '';
    
    if (!imageUrl) {
      return '/assets/images/cat.avif'; // Fallback image
    }

    // If it's already a full URL, return it as-is
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
        const normalizedBaseUrl = (app.baseURL || resolveBackendHost()).replace(/\/$/, '');
        const knownHosts = [DEV_BACKEND_HOST, PROD_BACKEND_HOST];
        return knownHosts.reduce((url, host) => url.replace(host, normalizedBaseUrl), imageUrl);
    }

    // Clean the URL - remove leading slash if present
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    
    // Construct full URL from baseURL
    // Try multiple possible paths
    const baseURL = app.baseURL.replace(/\/$/, ''); // Remove trailing slash
    
    // First try: direct path with baseURL
    // If the URL contains 'static', use it as-is
    if (cleanUrl.includes('static/') || cleanUrl.startsWith('static/')) {
      return `${baseURL}/${cleanUrl}`;
    }
    
    // Try common paths
    const possiblePaths = [
      `${baseURL}/static/${cleanUrl}`,
      `${baseURL}/${cleanUrl}`,
      `${baseURL}/uploads/${cleanUrl}`,
      `${baseURL}/images/${cleanUrl}`,
      `${baseURL}/public/${cleanUrl}`,
    ];
    
    // Return the first path (most likely: /static/filename)
    return possiblePaths[0];
  };

  const navigateToCategory = (category: any, event: React.MouseEvent) => {
    // Prevent navigation if user was dragging the swiper
    if (isDragging || (swiperInstance && swiperInstance.touching)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    window.location.href = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
  };

  return (
    <>
      <style jsx>{`
        .categories-section {
          background: white;
          padding: clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px);
          paddingTop: clamp(0px, 2vw, 20px);
          margin: 0 auto clamp(16px, 4vw, 32px) auto;
          max-width: 1400px;
          border-radius: clamp(16px, 4vw, 32px);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: clamp(20px, 3vw, 32px);
          gap: clamp(20px, 4vw, 32px);
          flex-wrap: wrap;
          position: relative;
          padding: 0 clamp(20px, 4vw, 40px);
        }

        .section-title {
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          font-weight: 900;
          background: linear-gradient(135deg, #1e293b 0%, #475569 30%, #64748b 50%, #475569 70%, #1e293b 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin: 0;
          letter-spacing: -0.5px;
          position: relative;
          padding: 0 clamp(24px, 5vw, 40px);
          animation: shimmer-text 4s ease-in-out infinite;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          line-height: 1.2;
        }

        @keyframes shimmer-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .section-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, transparent 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, transparent 100%);
          border-radius: 3px;
          opacity: 0.6;
        }

        .section-title::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, transparent 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, transparent 100%);
          border-radius: 3px;
          opacity: 0.6;
        }

        .filter-buttons {
          display: flex;
          gap: 0;
          align-items: center;
        }

        .filter-button {
          padding: 12px 28px;
          border-radius: 35px;
          font-size: clamp(0.85rem, 1.4vw, 1rem);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 3px solid transparent;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #495057;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          min-width: 110px;
        }

        .filter-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .filter-button:hover::before {
          left: 100%;
        }

        .filter-button.product {
          background: linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%);
          background-size: 200% 200%;
          color: white;
          border-color: #0063b1;
          box-shadow: 0 6px 24px rgba(0, 99, 177, 0.35), 
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
          animation: gradient-shift 3s ease infinite;
        }

        .filter-button.product:hover {
          background: linear-gradient(135deg, #005299 0%, #004080 50%, #003366 100%);
          border-color: #004080;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(0, 99, 177, 0.5), 
                      0 0 0 1px rgba(255, 255, 255, 0.15) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .filter-button.product.active {
          animation: pulse-blue 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        .filter-button.service {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          background-size: 200% 200%;
          color: white;
          border-color: #10b981;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.35), 
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
          animation: gradient-shift 3s ease infinite;
        }

        .filter-button.service:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
          border-color: #047857;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(16, 185, 129, 0.5), 
                      0 0 0 1px rgba(255, 255, 255, 0.15) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .filter-button.service.active {
          animation: pulse-green 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .filter-button:not(.product):not(.service):hover {
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
          border-color: #ced4da;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(0, 99, 177, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 8px 28px rgba(0, 99, 177, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
        }

        @keyframes pulse-green {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 8px 28px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
        }

        .categories-carousel {
          position: relative;
          padding: clamp(20px, 3vw, 30px) 50px;
          border-radius: clamp(16px, 3vw, 24px);
          transition: background 0.3s ease;
          margin: clamp(20px, 4vw, 30px) 0;
        }

        .categories-carousel.filter-product-bg {
          background: linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%);
        }

        .categories-carousel.filter-service-bg {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
        }

        .category-card {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #f3f4f6;
          border: 3px solid transparent;
        }

        .category-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
        }

        .category-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, transparent 50%, transparent 100%);
        }

        .category-name {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: clamp(0.85rem, 1.5vw, 1.1rem);
          font-weight: 700;
          text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 0, 0, 0.5);
          z-index: 10;
          line-height: 1.3;
          opacity: 0.85;
          text-align: center;
          max-width: 90%;
          padding: 0 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .category-badge {
          position: absolute;
          top: -1px;
          right: -1px;
          z-index: 15;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 20px 0 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
          border: 2px solid white;
        }

        .category-badge.product {
          background: #0063b1;
          border-color: #0063b1;
        }

        .category-badge.service {
          background: #10b981;
          border-color: #10b981;
        }

        .category-card:hover .category-badge {
          transform: scale(1.2);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
        }

        .category-badge svg {
          width: 12px;
          height: 12px;
          color: white !important;
          fill: white !important;
          stroke: white !important;
        }

        .category-badge svg path {
          fill: white !important;
          stroke: white !important;
        }


        /* Pagination dots */
        .swiper-pagination {
          position: relative;
          margin-top: 24px;
          bottom: auto !important;
        }

        .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #cbd5e1;
          opacity: 0.6;
          transition: all 0.3s ease;
          margin: 0 4px;
        }

        .swiper-pagination-bullet-active {
          background: #0063b1;
          opacity: 1;
          width: 24px;
          border-radius: 5px;
        }

        .swiper-pagination-bullet-active-main {
          background: #0063b1;
        }

        .swiper-pagination-bullet-active-prev,
        .swiper-pagination-bullet-active-next {
          background: #94a3b8;
          opacity: 0.8;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 1.1rem;
        }

        .empty-state {
            text-align: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 1.1rem;
        }

        /* Extra Small Devices (phones, 320px-479px) */
        @media (max-width: 479px) {
          .categories-section {
            padding: clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px);
            paddingTop: clamp(0px, 1vw, 12px);
            margin-bottom: clamp(12px, 3vw, 20px);
            border-radius: clamp(12px, 3vw, 20px);
          }

          .section-header {
            flex-direction: column;
            gap: clamp(12px, 2vw, 16px);
            margin-bottom: clamp(16px, 2.5vw, 24px);
            padding: 0 clamp(12px, 3vw, 16px);
          }

          .section-title {
            font-size: clamp(1.25rem, 4vw, 1.5rem);
            padding: 0 clamp(16px, 4vw, 24px);
            order: 1;
          width: 100%;
            margin-bottom: clamp(8px, 1.5vw, 12px);
        }

          .filter-buttons {
            order: 2;
          width: 100%;
          justify-content: center;
            gap: clamp(8px, 2vw, 12px);
          }

          .filter-button {
            padding: clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px);
            font-size: clamp(0.7rem, 2.5vw, 0.85rem);
            min-width: auto;
            flex: 1;
            max-width: 120px;
          }

          .categories-carousel {
            padding: clamp(16px, 2.5vw, 24px) clamp(30px, 8vw, 40px);
          }

          .category-card {
            border-radius: clamp(12px, 3vw, 16px);
          }

          .category-name {
            top: clamp(8px, 2vw, 12px);
            font-size: clamp(0.75rem, 2.5vw, 0.9rem);
            padding: 0 clamp(8px, 2vw, 12px);
            max-width: 95%;
          }

          .category-badge {
            width: clamp(18px, 4vw, 22px);
            height: clamp(18px, 4vw, 22px);
          }

          .category-badge svg {
            width: clamp(10px, 2.5vw, 11px);
            height: clamp(10px, 2.5vw, 11px);
          }

          .swiper-pagination {
            margin-top: clamp(16px, 3vw, 20px);
          }

          .swiper-pagination-bullet {
            width: clamp(8px, 2vw, 10px);
            height: clamp(8px, 2vw, 10px);
            margin: 0 clamp(3px, 1vw, 4px);
          }

          .swiper-pagination-bullet-active {
            width: clamp(16px, 4vw, 20px);
          }
        }

        /* Small Devices (phones, 480px-639px) */
        @media (min-width: 480px) and (max-width: 639px) {
          .categories-section {
            padding: clamp(16px, 3.5vw, 24px) clamp(16px, 3.5vw, 24px);
            paddingTop: clamp(8px, 1.5vw, 16px);
          }

          .section-header {
            gap: clamp(16px, 3vw, 24px);
            margin-bottom: clamp(20px, 3.5vw, 28px);
            padding: 0 clamp(16px, 3.5vw, 24px);
          }

          .section-title {
            font-size: clamp(1.4rem, 3.5vw, 1.8rem);
            padding: 0 clamp(20px, 4vw, 32px);
          }

          .filter-button {
            padding: clamp(10px, 2.5vw, 12px) clamp(20px, 4vw, 24px);
            font-size: clamp(0.8rem, 2vw, 0.9rem);
            min-width: 100px;
          }

          .categories-carousel {
            padding: clamp(18px, 2.8vw, 28px) clamp(35px, 7vw, 45px);
          }

          .category-name {
            font-size: clamp(0.85rem, 2.5vw, 1rem);
            top: clamp(12px, 2vw, 16px);
          }
        }

        /* Medium Devices (tablets, 640px-767px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .categories-section {
            padding: clamp(20px, 3.5vw, 32px) clamp(20px, 3.5vw, 32px);
          }

          .section-header {
            gap: clamp(20px, 3.5vw, 28px);
          }

          .section-title {
            font-size: clamp(1.6rem, 3.5vw, 2rem);
          }

          .filter-button {
            padding: clamp(11px, 2vw, 12px) clamp(24px, 4vw, 26px);
            font-size: clamp(0.85rem, 1.8vw, 0.95rem);
          }

          .categories-carousel {
            padding: clamp(20px, 3vw, 30px) clamp(40px, 6vw, 50px);
          }
        }

        /* Large Devices (tablets, 768px-1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .categories-section {
            padding: clamp(24px, 3.5vw, 36px) clamp(24px, 3.5vw, 36px);
          }

          .section-header {
            gap: clamp(24px, 3.5vw, 30px);
          }

          .section-title {
            font-size: clamp(1.8rem, 3.5vw, 2.1rem);
          }

          .categories-carousel {
            padding: clamp(22px, 3vw, 32px) 45px;
          }
        }

        /* Extra Large Devices (desktops, 1024px-1279px) */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .categories-section {
            padding: clamp(28px, 3.5vw, 40px) clamp(28px, 3.5vw, 40px);
          }

          .categories-carousel {
            padding: clamp(24px, 3.5vw, 36px) 48px;
          }
        }

        /* XXL Devices (large desktops, 1280px+) */
        @media (min-width: 1280px) {
          .categories-section {
            padding: clamp(32px, 3.5vw, 40px) clamp(32px, 3.5vw, 40px);
          }

          .categories-carousel {
            padding: clamp(24px, 3.5vw, 36px) 50px;
          }
        }

        /* Ultra Wide Screens (1440px+) */
        @media (min-width: 1440px) {
          .categories-section {
            max-width: 1600px;
          }
        }

        /* Landscape Orientation */
        @media (orientation: landscape) and (max-height: 500px) {
          .categories-section {
            padding: clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px);
          }

          .section-header {
            margin-bottom: clamp(12px, 2vw, 20px);
          }

          .categories-carousel {
            padding: clamp(16px, 2.5vw, 24px) clamp(30px, 5vw, 40px);
          }
        }
      `}</style>
      {/* Global styles for Swiper navigation buttons - must be outside styled-jsx */}
      <style dangerouslySetInnerHTML={{__html: `
        .categories-swiper .swiper-button-next,
        .categories-swiper .swiper-button-prev {
          width: clamp(28px, 5vw, 38px) !important;
          height: clamp(28px, 5vw, 38px) !important;
          background: white !important;
          border-radius: 50% !important;
          color: #1e293b !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease !important;
          border: none !important;
          margin-top: 0 !important;
          top: 55% !important;
          transform: translateY(-50%) !important;
        }

        .categories-swiper .swiper-button-next:hover,
        .categories-swiper .swiper-button-prev:hover {
          background: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          transform: translateY(-50%) scale(1.1) !important;
        }

        .categories-swiper .swiper-button-next::after,
        .categories-swiper .swiper-button-prev::after {
          font-family: none !important;
          font-size: 0 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          font-variant: normal !important;
          line-height: 1 !important;
          width: clamp(20px, 4vw, 28px) !important;
          height: clamp(20px, 4vw, 28px) !important;
          display: block !important;
          background: none !important;
          border: none !important;
          content: '' !important;
        }

        @media (max-width: 479px) {
          .categories-swiper .swiper-button-next,
          .categories-swiper .swiper-button-prev {
            width: 28px !important;
            height: 28px !important;
          }

          .categories-swiper .swiper-button-next::after,
          .categories-swiper .swiper-button-prev::after {
            width: 20px !important;
            height: 20px !important;
          }
        }

        @media (min-width: 480px) and (max-width: 767px) {
          .categories-swiper .swiper-button-next,
          .categories-swiper .swiper-button-prev {
            width: 32px !important;
            height: 32px !important;
          }

          .categories-swiper .swiper-button-next::after,
          .categories-swiper .swiper-button-prev::after {
            width: 24px !important;
            height: 24px !important;
          }
        }

        .categories-swiper .swiper-button-prev::after {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M15 12H9M9 12L12 9M9 12L12 15' stroke='%231e293b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
        }

        .categories-swiper .swiper-button-next::after {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M9 12H15M15 12L12 9M15 12L12 15' stroke='%231e293b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
        }

        .categories-swiper .swiper-button-next {
          right: 0 !important;
        }

        .categories-swiper .swiper-button-prev {
          left: 0 !important;
        }
      `}} />
      <div className="categories-section">
        <div className="section-header">
          <button
            className={`filter-button product ${filterType === 'PRODUCT' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'PRODUCT' ? 'ALL' : 'PRODUCT')}
          >
            Produit
          </button>
          <h2 className="section-title">Categories</h2>
          <button
            className={`filter-button service ${filterType === 'SERVICE' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'SERVICE' ? 'ALL' : 'SERVICE')}
          >
            Service
          </button>
                </div>
        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">No categories available at the moment</div>
        ) : (
          <div className={`categories-carousel ${filterType === 'PRODUCT' ? 'filter-product-bg' : filterType === 'SERVICE' ? 'filter-service-bg' : ''}`}>
            <Swiper
              modules={[Navigation, Pagination, Mousewheel, Keyboard, FreeMode, Autoplay]}
              navigation={true}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 1500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={categories.length > 5}
              speed={500}
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              keyboard={{
                enabled: true,
                onlyInViewport: true,
              }}
              freeMode={{
                enabled: true,
                sticky: false,
                momentumRatio: 0.5,
                momentumVelocityRatio: 0.5,
              }}
              grabCursor={true}
              spaceBetween={16}
              slidesPerView={1.5}
              breakpoints={{
                320: {
                  slidesPerView: 1.5,
                  spaceBetween: 12,
                },
                375: {
                  slidesPerView: 2,
                  spaceBetween: 14,
                },
                480: {
                  slidesPerView: 2.2,
                  spaceBetween: 16,
                },
                640: {
                  slidesPerView: 3,
                  spaceBetween: 18,
                },
                768: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 5,
                  spaceBetween: 22,
                },
                1280: {
                  slidesPerView: 5,
                  spaceBetween: 24,
                },
                1440: {
                  slidesPerView: 5,
                  spaceBetween: 24,
                },
              }}
              onSwiper={setSwiperInstance}
              onTouchStart={() => setIsDragging(false)}
              onTouchMove={() => setIsDragging(true)}
              onTouchEnd={() => {
                setTimeout(() => setIsDragging(false), 50);
              }}
              onSliderMove={() => setIsDragging(true)}
              onSlideChangeTransitionStart={() => setIsDragging(true)}
              onSlideChangeTransitionEnd={() => {
                setTimeout(() => setIsDragging(false), 100);
              }}
              className="categories-swiper"
            >
              {categories.map((category) => {
                const categoryType = category.type?.toUpperCase() || 'PRODUCT';
                const isProduct = categoryType === 'PRODUCT';
                const isService = categoryType === 'SERVICE';
                
                return (
                  <SwiperSlide key={category._id || category.id}>
                    <div 
                      className={`category-card ${isProduct ? 'product' : isService ? 'service' : ''}`}
                      onClick={(e) => navigateToCategory(category, e)}
                    >
                    <img
                      src={getCategoryImageUrl(category)}
                      alt={category.name}
                      className="category-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/cat.avif';
                      }}
                    />
                    <div className="category-overlay"></div>
                    {isProduct && (
                      <div className="category-badge product">
                        <FaShoppingBag />
                </div>
                    )}
                    {isService && (
                      <div className="category-badge service">
                        <FaHandshake />
                </div>
                    )}
                    <div className="category-name">{category.name}</div>
                    </div>
                </SwiperSlide>
              );
            })}
            </Swiper>
                    </div>
        )}
      </div>
    </>
  );
};

export default Home1Banner;