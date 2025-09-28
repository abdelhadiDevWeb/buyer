// Home1LiveTenders.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { TendersAPI } from "@/app/api/tenders";
import app from '@/config';
import { Tender, TENDER_STATUS } from '@/types/tender';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";

// Default image constants
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

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

const Home1LiveTenders = () => {
  const t = (key: string, _opts?: any) => {
    const translations = {
      'liveTenders.buyer': 'Acheteur'
    };
    return translations[key] || key;
  };
  const [liveTenders, setLiveTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);

  // Fetch tenders
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const data = await TendersAPI.getActiveTenders();

        // Filter out ended tenders and limit to 8 for display
        const tendersData = (data as any).data || data;
        const activeTenders = tendersData.filter((tender: Tender) => {
          if (!tender.endingAt) return false;
          const endTime = new Date(tender.endingAt);
          return endTime > new Date() && tender.status === TENDER_STATUS.OPEN;
        }).slice(0, 8);

        setLiveTenders(activeTenders);
        setError(null);
      } catch (err) {
        console.error("Error fetching tenders:", err);
        setError("Failed to load tenders");
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  // Update timers
  useEffect(() => {
    if (liveTenders.length === 0) return;

    const updateTimers = () => {
      const newTimers: { [key: string]: Timer } = {};
      liveTenders.forEach(tender => {
        if (tender._id && tender.endingAt) {
          newTimers[tender._id] = calculateTimeRemaining(tender.endingAt);
        }
      });
      setTimers(newTimers);
    };

    // Initial update
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [liveTenders]);

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

    const tenderCards = document.querySelectorAll('.tender-card-animate');
    tenderCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [liveTenders]);

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  // Calculate savings
  const calculateSavings = useCallback((maxBudget: number, currentLowest: number) => {
    const savings = maxBudget - currentLowest;
    const percentage = ((savings / maxBudget) * 100).toFixed(0);
    return { savings, percentage };
  }, []);

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
      nextEl: ".tender-slider-next",
      prevEl: ".tender-slider-prev",
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
      <div className="modern-tenders-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
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
            <p style={{ marginTop: '15px', color: '#666' }}>Chargement des appels d'offres...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-tenders-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
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

        .tender-card-animate {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .tender-card-animate.animated {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .tender-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .tender-card-hover:hover {
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

      <div className="modern-tenders-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0', background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
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
              background: 'linear-gradient(90deg, #28a745, #20c997)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Appels d'offres en cours
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}>
              Explorez les appels d'offres actifs et soumettez vos propositions.
            </p>
          </div>

          {/* Tenders Content */}
          {liveTenders.length > 0 ? (
            <div className="tender-carousel-container" style={{ position: 'relative' }}>
              <Swiper
                {...settings}
                className="swiper tender-slider"
                style={{
                  padding: '20px 0 50px',
                  overflow: 'visible',
                }}
              >
                {liveTenders.map((tender, idx) => {
                  const timer = timers[tender._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                  const isAnimated = animatedCards.includes(idx);
                  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;
                  const { savings, percentage } = calculateSavings(tender.maxBudget, tender.currentLowestBid);

                  // Determine the display name for the tender owner
                  const ownerName = tender.owner?.firstName && tender.owner?.lastName
                    ? `${tender.owner.firstName} ${tender.owner.lastName}`.trim()
                    : tender.owner?.name;
                  const displayName = ownerName || t('liveTenders.buyer');

                  return (
                    <SwiperSlide key={tender._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`tender-card-animate tender-card-hover ${isAnimated ? 'animated' : ''}`}
                        style={{
                          background: 'white',
                          borderRadius: 'clamp(16px, 3vw, 20px)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          width: '100%',
                          maxWidth: '320px',
                          position: 'relative',
                          minHeight: '380px',
                        }}
                      >
                        {/* Tender Image */}
                        <div style={{
                          position: 'relative',
                          height: 'clamp(160px, 25vw, 200px)',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #28a745, #20c997)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url ? (
                            <img
                              src={`${app.imageBaseURL}${tender.attachments[0].url}`}
                              alt={tender.title || 'Tender'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s ease',
                              }}
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{
                              color: 'white',
                              fontSize: '48px',
                              textAlign: 'center',
                            }}>
                              {tender.tenderType === 'PRODUCT' ? '📦' : '🔧'}
                            </div>
                          )}

                          {/* Timer Overlay */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: isUrgent ? 'linear-gradient(45deg, #ff4444, #ff6666)' : 'linear-gradient(45deg, #28a745, #20c997)',
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

                          {/* Type Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            color: '#333',
                            padding: '6px 12px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {tender.tenderType === 'PRODUCT' ? 'Produit' : 'Service'}
                          </div>
                        </div>

                        {/* Tender Details */}
                        <div style={{ padding: 'clamp(16px, 3vw, 20px)' }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#222',
                            marginBottom: '12px',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {tender.title || 'Tender Title'}
                          </h3>

                          {/* Budget Info */}
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
                              }}>
                                Budget maximal
                              </p>
                              <p style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#28a745',
                                margin: 0,
                              }}>
                                {formatPrice(tender.maxBudget)}
                              </p>
                            </div>

                            <div>
                              <p style={{
                                fontSize: '12px',
                                color: '#666',
                                margin: '0 0 4px 0',
                              }}>
                                Meilleure offre
                              </p>
                              <p style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#20c997',
                                margin: 0,
                              }}>
                                {formatPrice(tender.currentLowestBid)}
                              </p>
                            </div>
                          </div>

                          {/* Savings Indicator */}
                          {savings > 0 && (
                            <div style={{
                              background: 'linear-gradient(45deg, #28a745, #20c997)',
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textAlign: 'center',
                              marginBottom: '16px',
                            }}>
                              Économies: {formatPrice(savings)} ({percentage}%)
                            </div>
                          )}

                          {/* Owner Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '16px',
                          }}>
                            <img
                              src={tender.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
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

                         {/* Submit Proposal Button */}
                          <Link
                            href={`/tender-details/${tender._id}`} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '12px 20px',
                              background: 'linear-gradient(90deg, #28a745, #20c997)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '25px',
                              fontWeight: '600',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #20c997, #28a745)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                            }}
                          >
                            Soumettre une proposition
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
                  className="tender-slider-prev"
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
                    e.currentTarget.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
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
                  className="tender-slider-next"
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
                    e.currentTarget.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
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
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: 'fadeInUp 0.8s ease-out forwards',
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
              }}>📋</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
              }}>
                Aucun appel d'offres
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '30px',
              }}>
                Revenez plus tard pour voir les nouveaux appels d'offres
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
              <Link
              href="/tender-sidebar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'linear-gradient(90deg, #28a745, #20c997)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #20c997, #28a745)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(40, 167, 69, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.3)';
              }}
              >
              Voir tous les appels d'offres
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

export default Home1LiveTenders;
