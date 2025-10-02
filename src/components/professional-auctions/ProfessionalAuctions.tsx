"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { AuctionsAPI } from "@/app/api/auctions";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { CLIENT_TYPE } from '@/types/User';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface ProfessionalAuction {
  _id: string;
  title: string;
  name?: string;
  thumbs?: Array<{ _id: string; url: string; filename?: string }>;
  endingAt?: string;
  currentPrice?: number;
  startingPrice?: number;
  seller?: {
    _id: string;
    name?: string;
    profileImage?: { url: string; }; 
    photoURL?: string;
  };
  owner?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    profileImage?: { url: string; }; 
    photoURL?: string;
  };
  status?: string;
  isPro?: boolean; // Professional auction flag
  hidden?: boolean; // Anonymous seller flag
}

// Timer interface
interface Timer {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  hasEnded: boolean;
}

// Helper function to calculate time remaining
export function calculateTimeRemaining(endDate: string): Timer {
  const now = new Date();
  const endTime = new Date(endDate);
  const timeDiff = endTime.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      hasEnded: true,
    };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return {
    days: days.toString().padStart(2, "0"),
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
    hasEnded: false,
  };
}

const ProfessionalAuctions: React.FC = () => {
  const { t } = useTranslation();
  const { isLogged, auth } = useAuth();
  const [professionalAuctions, setProfessionalAuctions] = useState<ProfessionalAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);

  // Fetch professional auctions
  useEffect(() => {
    const fetchProfessionalAuctions = async () => {
      if (!isLogged || auth?.user?.type !== CLIENT_TYPE.PROFESSIONAL) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await AuctionsAPI.getAuctions();
        
        const auctionsData = (response as any).data || response;
        if (auctionsData && Array.isArray(auctionsData)) {
          // Filter only professional auctions (isPro: true) and active auctions
          const proAuctions = auctionsData.filter((auction: ProfessionalAuction) => {
            if (!auction.endingAt) return false;
            const endTime = new Date(auction.endingAt);
            const isActive = endTime > new Date();
            return auction.isPro === true && isActive;
          });
          setProfessionalAuctions(proAuctions);
          setError(null);
        } else {
          setProfessionalAuctions([]);
        }
      } catch (err) {
        console.error("Error fetching professional auctions:", err);
        setError("Failed to load professional auctions");
        setProfessionalAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalAuctions();
  }, [isLogged, auth?.user?.type]);

  // Update timers
  useEffect(() => {
    if (professionalAuctions.length === 0) return;

    const updateTimers = () => {
      const newTimers: { [key: string]: Timer } = {};
      professionalAuctions.forEach(auction => {
        if (auction._id && auction.endingAt) {
          newTimers[auction._id] = calculateTimeRemaining(auction.endingAt);
        }
      });
      setTimers(newTimers);
    };

    // Initial update
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [professionalAuctions]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setAnimatedCards(prev => [...prev, index]);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    );

    const auctionCards = document.querySelectorAll('.professional-auction-card-animate');
    auctionCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [professionalAuctions]);

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  // Helper function to get seller display name
  const getSellerDisplayName = useCallback((auction: ProfessionalAuction) => {
    if (auction.hidden === true) {
      return t('common.anonymous');
    }
    
    const ownerName = auction.owner?.firstName && auction.owner?.lastName 
      ? `${auction.owner.firstName} ${auction.owner.lastName}`
      : auction.owner?.name;
    const sellerName = auction.seller?.name;
    
    return ownerName || sellerName || t('professionalAuctions.seller');
  }, [t]);

  // Swiper settings
  const settings = useMemo(() => ({
    slidesPerView: "auto" as const,
    speed: 1200,
    spaceBetween: 25,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    navigation: {
      nextEl: ".professional-auction-slider-next",
      prevEl: ".professional-auction-slider-prev",
    },
    pagination: {
      el: ".professional-swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      280: {
        slidesPerView: 1,
        spaceBetween: 15,
      },
      576: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 25,
      },
      1200: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  }), []);

  // Don't render if user is not logged in or not professional
  if (!isLogged || auth?.user?.type !== 'PROFESSIONAL') {
    return null;
  }

  if (loading) {
    return (
      <div className="professional-auctions-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0063b1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="professional-auctions-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div className="alert alert-warning" style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              color: '#856404',
            }}>
              <h3>{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
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
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .professional-auctions-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          position: relative;
          overflow: hidden;
          animation: sectionFadeIn 1s ease-out;
        }
        @keyframes sectionFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .professional-auctions-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(0, 99, 177, 0.02) 0%, rgba(0, 163, 224, 0.02) 100%);
          pointer-events: none;
        }
        .professional-auction-slider .swiper-slide:first-child {
          margin-left: 30px;
        }
        .professional-auction-slider .swiper-slide:last-child {
          margin-right: 30px;
        }
        .professional-auction-slider .swiper-slide {
          padding-left: 10px;
          padding-right: 10px;
        }
        @media (max-width: 768px) {
          .professional-auction-slider .swiper-slide:first-child {
            margin-left: 15px;
          }
          .professional-auction-slider .swiper-slide:last-child {
            margin-right: 15px;
          }
          .auction-carousel-container {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
        .professional-auction-card-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }
        .professional-auction-card-animate.animated {
          opacity: 1;
          transform: translateY(0);
        }
        .professional-auction-card-hover {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .professional-auction-card-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
          z-index: 1;
        }
        .professional-auction-card-hover:hover::before {
          left: 100%;
        }
        .professional-auction-card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .professional-auction-card-hover:hover .professional-badge {
          animation: badgePulse 0.5s ease-in-out infinite;
        }
        .professional-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
          z-index: 3;
          animation: badgePulse 2s ease-in-out infinite;
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }
        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.6);
          }
        }
        .professional-badge::before {
          content: '⭐';
          margin-right: 4px;
          animation: starTwinkle 1.5s ease-in-out infinite;
        }
        .professional-badge::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          border-radius: 25px;
          z-index: -1;
          opacity: 0.3;
          animation: badgeGlow 2s ease-in-out infinite;
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 1; transform: rotate(0deg); }
          50% { opacity: 0.7; transform: rotate(180deg); }
        }
        @keyframes badgeGlow {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1.1);
          }
        }
        .professional-timer {
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(45deg, #0063b1, #00a3e0);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 2;
        }
        .professional-timer.urgent {
          background: linear-gradient(45deg, #ff4444, #ff6666);
          animation: pulse 0.5s infinite;
        }
        .timer-digit {
          animation: pulse 1s infinite;
        }
        .timer-digit.urgent {
          animation: pulse 0.5s infinite;
          color: #ff4444;
        }
      `}</style>

      <div className="professional-auctions-section" style={{ padding: 'clamp(60px, 10vw, 100px) 0' }}>
        <div className="container-responsive">
          {/* Section Header */}
          <div className="section-header" style={{
            textAlign: 'center',
            marginBottom: 'clamp(30px, 6vw, 50px)',
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeInUp 0.8s ease-out forwards',
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              color: '#222',
              marginBottom: '16px',
              background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('professionalAuctions.title', 'Professional Auctions')}
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}>
              {t('professionalAuctions.description', 'Exclusive professional auctions available only to verified professional users')}
            </p>
          </div>

          {/* Professional Auctions Content */}
          {professionalAuctions.length > 0 ? (
            <div className="auction-carousel-container" style={{ 
              position: 'relative',
              paddingLeft: '20px',
              paddingRight: '20px'
            }}>
              <Swiper
                {...settings}
                className="swiper professional-auction-slider"
                style={{
                  padding: '30px 0 60px',
                  overflow: 'visible',
                }}
              >
                {professionalAuctions.map((auction, idx) => {
                  const timer = timers[auction._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                  const isAnimated = animatedCards.includes(idx);
                  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;
                  
                  return (
                    <SwiperSlide key={auction._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`professional-auction-card-animate professional-auction-card-hover ${isAnimated ? 'animated' : ''}`}
                        style={{
                          background: 'white',
                          borderRadius: 'clamp(16px, 3vw, 20px)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          width: '100%',
                          maxWidth: '320px',
                          position: 'relative',
                          minHeight: '360px',
                        }}
                      >
                        {/* Professional Badge */}
                        <div className="professional-badge">
                          PROFESSIONAL
                        </div>

                        {/* Auction Image */}
                        <div style={{
                          position: 'relative',
                          height: 'clamp(160px, 25vw, 200px)',
                          overflow: 'hidden',
                        }}>
                          <img
                            src={
                              auction.thumbs && auction.thumbs.length > 0
                                ? `${app.route}${auction.thumbs[0].url}`
                                : DEFAULT_AUCTION_IMAGE
                            }
                            alt={auction.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_AUCTION_IMAGE;
                            }}
                          />
                          
                          {/* Timer */}
                          <div className={`professional-timer ${isUrgent ? 'urgent' : ''}`}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.hours}</span>
                              <span>:</span>
                              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.minutes}</span>
                              <span>:</span>
                              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.seconds}</span>
                            </div>
                          </div>
                        </div>

                        {/* Auction Details */}
                        <div style={{ padding: 'clamp(16px, 3vw, 20px)' }}>
                          <h3 style={{
                            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                            fontWeight: '600',
                            color: '#222',
                            marginBottom: '8px',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {auction.title}
                          </h3>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                          }}>
                            <div>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                margin: '0 0 4px 0',
                              }}>
                                Current Price
                              </p>
                              <p style={{
                                fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                                fontWeight: '700',
                                color: '#0063b1',
                                margin: 0,
                              }}>
                                {auction.currentPrice ? formatPrice(auction.currentPrice) : 'N/A'}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#666',
                                margin: '0 0 4px 0',
                              }}>
                                Starting
                              </p>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#999',
                                margin: 0,
                                textDecoration: 'line-through',
                              }}>
                                {auction.startingPrice ? formatPrice(auction.startingPrice) : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Seller Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '16px',
                          }}>
                            <img
                              src={
                                auction.seller?.profileImage?.url
                                  ? `${app.route}${auction.seller.profileImage.url}`
                                  : auction.owner?.profileImage?.url
                                  ? `${app.route}${auction.owner.profileImage.url}`
                                  : auction.seller?.photoURL
                                  ? `${app.route}${auction.seller.photoURL}`
                                  : auction.owner?.photoURL
                                  ? `${app.route}${auction.owner.photoURL}`
                                  : DEFAULT_PROFILE_IMAGE
                              }
                              alt="Seller"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginRight: '8px',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE;
                              }}
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#666',
                              fontWeight: '500',
                            }}>
                               {auction.hidden ? t('common.anonymous') : getSellerDisplayName(auction)}
                            </span>
                          </div>

                          {/* View Details Button */}
                          <Link href={`/auction-details/${auction._id}`}>
                            <button
                              style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              View Details
                            </button>
                          </Link>

                          {/* Anonymous Footer */}
                          {auction.hidden && (
                            <div style={{
                              textAlign: 'center',
                              marginTop: '12px',
                              padding: '8px 12px',
                              background: 'rgba(255, 107, 107, 0.1)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 107, 107, 0.2)',
                            }}>
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#ff6b6b',
                                fontWeight: '500',
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}>
                                <span>👤</span>
                                {t('common.anonymous')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Navigation Buttons */}
              <button
                className="professional-auction-slider-prev"
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0063b1';
                  e.currentTarget.style.borderColor = '#0063b1';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#666';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>

              <button
                className="professional-auction-slider-next"
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0063b1';
                  e.currentTarget.style.borderColor = '#0063b1';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#666';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>

              {/* Pagination */}
              <div className="professional-swiper-pagination" style={{
                textAlign: 'center',
                marginTop: '20px',
              }} />
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#94a3b8">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                No Professional Auctions Available
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                margin: 0,
              }}>
                Check back later for exclusive professional auctions
              </p>
            </div>
          )}

          {/* View All Button */}
          <div style={{
            textAlign: 'center',
            marginTop: '50px',
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
          }}>
            <Link href="/auction-sidebar">
              <button
                style={{
                  background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '16px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 8px 25px rgba(0, 99, 177, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 99, 177, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 99, 177, 0.3)';
                }}
              >
                View All Professional Auctions
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfessionalAuctions;
