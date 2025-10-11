// Home1LiveAuction.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { AuctionsAPI } from "@/app/api/auctions";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface Auction {
  _id: string;
  title: string;
  name?: string;
  thumbs?: Array<{ _id: string; url: string; filename?: string }>;
  endingAt?: string;
  currentPrice?: number;
  startingPrice?: number;
  isPro?: boolean;
  hidden?: boolean;
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
  // --- Added properties to match usage in JSX ---
  quantity?: string | number;
  location?: string;
  wilaya?: string;
  description?: string;
  biddersCount?: number;
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
  const total = Date.parse(endDate) - Date.now();
  const hasEnded = total <= 0;

  if (hasEnded) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      hasEnded: true
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hasEnded: false
  };
}

// Helper function to get the correct image URL
const getAuctionImageUrl = (auction: Auction) => {
  if (auction.thumbs && auction.thumbs.length > 0 && auction.thumbs[0].url) {
    const imageUrl = auction.thumbs[0].url;
    console.log('🔍 Auction Image URL Debug:', {
      originalUrl: imageUrl,
      appRoute: app.route,
      constructedUrl: `${app.route}${imageUrl}`
    });
    
    // Handle different URL formats
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already a full URL
    } else if (imageUrl.startsWith('/')) {
      return `${app.route}${imageUrl}`; // Starts with slash
    } else {
      return `${app.route}/${imageUrl}`; // No slash, add one
    }
  }
  return DEFAULT_AUCTION_IMAGE;
};

const Home1LiveAuction = () => {
  const { t } = useTranslation();
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);


  // Fetch auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data = await AuctionsAPI.getAuctions();

        // Filter out ended auctions and exclude professional auctions (they go to Professional Auctions section)
        const auctionsData = (data as any).data || data;
        const activeAuctions = auctionsData.filter((auction: Auction) => {
          if (!auction.endingAt) return false;
          const endTime = new Date(auction.endingAt);
          const isActive = endTime > new Date();

          // Exclude professional auctions from live auctions section
          // Professional auctions should only appear in Professional Auctions section
          if (auction.isPro === true) {
            return false;
          }

          // Show only non-professional auctions in live auctions section
          return isActive;
        }).slice(0, 8);

        setLiveAuctions(activeAuctions);
        setError(null);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError("Failed to load auctions");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  // Update timers
  useEffect(() => {
    if (liveAuctions.length === 0) return;

    const updateTimers = () => {
      const newTimers: { [key: string]: Timer } = {};
      liveAuctions.forEach(auction => {
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
  }, [liveAuctions]);

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

    const auctionCards = document.querySelectorAll('.auction-card-animate');
    auctionCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [liveAuctions]);

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  // Helper function to get seller display name
  const getSellerDisplayName = useCallback((auction: Auction) => {
    if (auction.hidden === true) {
      return t('common.anonymous');
    }

    const ownerName = auction.owner?.firstName && auction.owner?.lastName
      ? `${auction.owner.firstName} ${auction.owner.lastName}`
      : auction.owner?.name;
    const sellerName = auction.seller?.name;

    return ownerName || sellerName || t('liveAuction.seller');
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
      nextEl: ".auction-slider-next",
      prevEl: ".auction-slider-prev",
    },
    pagination: {
      el: ".swiper-pagination",
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
        spaceBetween: 25,
      },
      1400: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  }), []);

  if (loading) {
    return (
      <div className="modern-auctions-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
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
            }}></div>
            <p style={{ marginTop: '15px', color: '#666' }}>{t('liveAuction.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-auctions-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
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

        /* Mobile responsiveness fixes */
        @media (max-width: 768px) {
          .modern-auctions-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 40px 16px !important;
            transform: none !important;
            transition: none !important;
            position: relative !important;
            z-index: 10 !important;
            min-height: 200px !important;
          }
          
          .section-header {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          
          .auction-carousel-container {
            padding: 0 16px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .swiper {
            padding: 0 16px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Force all auction content to be visible */
          .auction-card, .swiper-slide, .auction-item {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Ensure empty state is visible on mobile */
          .empty-state-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            margin: 20px 0 !important;
          }
          
          /* Ensure view all button is visible on mobile */
          .view-all-button-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            margin: 30px 0 !important;
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

        .auction-card-animate {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .auction-card-animate.animated {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .auction-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .auction-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.15);
        }

        .timer-digit {
          animation: pulse 1s infinite;
        }

        .timer-digit.urgent {
          animation: pulse 0.5s infinite;
          color: #ff4444;
        }
      `}</style>

      <div className="modern-auctions-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
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
              {t('liveAuction.title')}
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}>
              {t('liveAuction.description')}
            </p>
          </div>

          {/* Auctions Content */}
          {liveAuctions.length > 0 ? (
            <div className="auction-carousel-container" style={{ position: 'relative' }}>
              <Swiper
                {...settings}
                className="swiper auction-slider"
                style={{
                  padding: '20px 0 50px',
                  overflow: 'visible',
                }}
              >
                {liveAuctions.map((auction, idx) => {
                  const timer = timers[auction._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                  const isAnimated = animatedCards.includes(idx);
                  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;

                  // Get seller display name (handles anonymous sellers)
                  const displayName = getSellerDisplayName(auction);

                  // Auction thumbs data available for debugging if needed

                  return (
                    <SwiperSlide key={auction._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`auction-card-animate auction-card-hover ${isAnimated ? 'animated' : ''}`}
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
                        {/* Auction Image */}
                        <div style={{
                          position: 'relative',
                          height: 'clamp(160px, 25vw, 200px)',
                          overflow: 'hidden',
                        }}>
                          <img
                            src={getAuctionImageUrl(auction)}
                            alt={auction.title || auction.name || 'Auction'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            onError={(e) => {
                              console.error('❌ Auction Image Load Error:', getAuctionImageUrl(auction));
                              (e.target as HTMLImageElement).src = DEFAULT_AUCTION_IMAGE;
                            }}
                          />

                          {/* Professional Badge */}
                          {auction.isPro && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                              color: '#1a1a1a',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              zIndex: 2,
                            }}>
                              <span>👑</span>
                              <span>PRO</span>
                            </div>
                          )}

                          {/* Timer Overlay */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: isUrgent ? 'linear-gradient(45deg, #ff4444, #ff6666)' : 'linear-gradient(45deg, #0063b1, #00a3e0)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          }}>
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
                          {/* Title */}
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '12px',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {auction.title || auction.name || 'Auction Title'}
                          </h3>

                          {/* Quantity and Location Info */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '16px',
                          }}>
                            <div>
                              <p style={{
                                fontSize: '12px',
                                color: '#666',
                                margin: '0 0 4px 0',
                                fontWeight: '600',
                              }}>
                                Quantité
                              </p>
                              <p style={{
                                fontSize: '14px',
                                color: '#333',
                                margin: 0,
                                fontWeight: '500',
                              }}>
                                {auction.quantity || 'Non spécifiée'}
                              </p>
                            </div>

                            <div>
                              <p style={{
                                fontSize: '12px',
                                color: '#666',
                                margin: '0 0 4px 0',
                                fontWeight: '600',
                              }}>
                                Localisation
                              </p>
                              <p style={{
                                fontSize: '14px',
                                color: '#333',
                                margin: 0,
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {auction.location || auction.wilaya || 'Non spécifiée'}
                              </p>
                            </div>
                          </div>

                          {/* Separator Line */}
                          <div style={{
                            width: '100%',
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                            margin: '0 0 16px 0',
                          }}></div>

                          {/* Description */}
                          {auction.description && (
                            <div style={{
                              marginBottom: '16px',
                            }}>
                              <p style={{
                                fontSize: '12px',
                                color: '#666',
                                margin: '0 0 4px 0',
                                fontWeight: '600',
                              }}>
                                Description
                              </p>
                              <p style={{
                                fontSize: '13px',
                                color: '#555',
                                margin: 0,
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {auction.description}
                              </p>
                            </div>
                          )}

                          {/* Separator Line after Description */}
                          {auction.description && (
                            <div style={{
                              width: '100%',
                              height: '1px',
                              background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                              margin: '0 0 16px 0',
                            }}></div>
                          )}

                          {/* Price Info */}
                          <div style={{
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px',
                            border: '1px solid #e9ecef',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#28a745',
                                animation: 'pulse 2s infinite',
                              }}></div>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#28a745',
                              }}>
                                Prix actuel
                              </span>
                            </div>
                            <div style={{
                              textAlign: 'center',
                              marginTop: '8px',
                            }}>
                              <p style={{
                                fontSize: '22px',
                                fontWeight: '800',
                                margin: 0,
                                color: '#0063b1',
                                background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}>
                                {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
                              </p>
                            </div>
                          </div>

                          {/* Separator Line after Price */}
                          <div style={{
                            width: '100%',
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                            margin: '0 0 16px 0',
                          }}></div>

                          {/* Bidders Count */}
                          <div style={{
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px',
                            border: '1px solid #e9ecef',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#0063b1',
                                animation: 'pulse 2s infinite',
                              }}></div>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#0063b1',
                              }}>
                                {auction.biddersCount || 0} participant{(auction.biddersCount || 0) !== 1 ? 's' : ''}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: '#666',
                              }}>
                                ont enchéri
                              </span>
                            </div>
                          </div>

                          {/* Separator Line after Bidders Count */}
                          <div style={{
                            width: '100%',
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                            margin: '0 0 16px 0',
                          }}></div>

                          {/* Seller Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '16px',
                          }}>
                            <img
                              src={auction.seller?.photoURL || auction.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
                              alt={displayName}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_PROFILE_IMAGE;
                              }}
                            />
                            <span style={{
                              fontSize: '14px',
                              color: '#666',
                              fontWeight: '500',
                            }}>
                              {displayName}
                            </span>
                          </div>

                          {/* View Auction Button */}
                          <Link
                            href={`/auction-details/${auction._id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '12px 20px',
                              background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '25px',
                              fontWeight: '600',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 12px rgba(0, 99, 177, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                            }}
                          >
                            Voir les détails
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Navigation Buttons */}
              <div className="slider-navigation" style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                <button
                  className="auction-slider-prev"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginLeft: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12Z"/>
                  </svg>
                </button>

                <button
                  className="auction-slider-next"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginRight: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                  </svg>
                </button>
              </div>

              {/* Pagination */}
              <div className="swiper-pagination" style={{
                position: 'relative',
                marginTop: '30px',
              }}></div>
            </div>
          ) : (
            <div 
              className="empty-state-container"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                opacity: 0,
                transform: 'translateY(30px)',
                animation: 'fadeInUp 0.8s ease-out forwards',
                margin: '20px 0',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
              }}>🔍</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
              }}>
                {t('liveAuction.noAuctions')}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '30px',
              }}>
                {t('liveAuction.noAuctions')}
              </p>
              <Link
                href="/auction-sidebar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '25px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 99, 177, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('liveAuction.viewAll')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                </svg>
              </Link>
            </div>
          )}


          {/* View All Button - Always visible on mobile */}
          <div 
            className="view-all-button-container"
            style={{
              textAlign: 'center',
              marginTop: '50px',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            }}>
            <Link
              href="/auction-sidebar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 8px 25px rgba(0, 99, 177, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 99, 177, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 99, 177, 0.3)';
              }}
            >
              {t('liveAuction.viewAll')}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home1LiveAuction;