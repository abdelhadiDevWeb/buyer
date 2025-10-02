"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import useAuth from '@/hooks/useAuth';
import { UserAPI, USER_TYPE } from "@/app/api/users";

interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  type: USER_TYPE;
  role?: string;
  rating: number;
  joinDate: string;
  totalBids: number;
  winningBids: number;
  totalAuctions?: number;
  completedAuctions?: number;
  phone?: string;
  location?: string;
  description?: string;
  verificationStatus?: string;
  isRecommended?: boolean; 
  history: {
    date: string;
    action: string;
    itemName: string;
    amount: number;
    status: string;
  }[];
}

interface ApiError {
  response?: {
    data?: unknown;
    status?: number;
  };
}

export default function UserDetailsPage() {
  const { initializeAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "auctions" | "reviews">("overview");

  const userId = params?.id as string;

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching user details for ID:', userId);
      
      // Get user details and recommended users
      const [userResponse, recommendedProfessionals, recommendedResellers] = await Promise.all([
        UserAPI.getUserById(userId),
        UserAPI.getRecommendedProfessionals().catch(() => []),
        UserAPI.getRecommendedResellers().catch(() => [])
      ]);
      
      console.log('User details API response:', userResponse);
      console.log('Recommended professionals:', recommendedProfessionals);
      console.log('Recommended resellers:', recommendedResellers);
      
      // Handle both direct response and nested data response
      const userData = userResponse?.data || userResponse;
      
      if (userData) {
        // Check if this user is in the recommended lists
        const recProfIds = Array.isArray(recommendedProfessionals) ? 
          recommendedProfessionals.map((u: any) => u._id) : 
          ((recommendedProfessionals as any)?.data || []).map((u: any) => u._id);
        
        const recResellerIds = Array.isArray(recommendedResellers) ? 
          recommendedResellers.map((u: any) => u._id) : 
          ((recommendedResellers as any)?.data || []).map((u: any) => u._id);

        const isRecommended = recProfIds.includes((userData as any)._id) || recResellerIds.includes((userData as any)._id);

        const transformedUser: User = {
          _id: (userData as any)._id,
          firstName: (userData as any).firstName || 'Unknown',
          lastName: (userData as any).lastName || '',
          email: (userData as any).email || 'No email',
          avatar: (userData as any).photoURL || (userData as any).avatar?.url || (userData as any).avatar,
          photoURL: (userData as any).photoURL,
          type: (userData as any).type || (userData as any).accountType || USER_TYPE.CLIENT,
          role: (userData as any).role,
          rating: typeof (userData as any).rate === 'number' ? (userData as any).rate : ((userData as any).rating || 0),
          joinDate: (userData as any).createdAt || new Date().toISOString(),
          totalBids: (userData as any).totalBids || 0,
          winningBids: (userData as any).winningBids || 0,
          totalAuctions: (userData as any).totalAuctions || 0,
          completedAuctions: (userData as any).completedAuctions || 0,
          phone: (userData as any).phone,
          location: (userData as any).location,
          description: (userData as any).description,
          verificationStatus: (userData as any).verificationStatus || ((userData as any).isVerified ? 'verified' : 'unverified'),
          isRecommended: Boolean((userData as any).isRecommended || isRecommended),
          history: (userData as any).history || []
        };
        console.log('Transformed user with recommended status:', transformedUser);
        setUser(transformedUser);
      } else {
        console.error('No user data received');
        setUser(null);
      }
    } catch (error: unknown) {
      console.error("Error fetching user details:", error);
      console.error("Error response:", (error as ApiError)?.response);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    initializeAuth();
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, initializeAuth, fetchUserDetails]);

  const getUserFullName = (user: User): string => {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Render filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i 
          key={`full-${i}`} 
          className="bi bi-star-fill animated-star" 
          style={{ 
            color: "#FFD700",
            animationDelay: `${i * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <i 
          key="half" 
          className="bi bi-star-half animated-star" 
          style={{ 
            color: "#FFD700",
            animationDelay: `${fullStars * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    // Render empty stars to make total of 10
    const emptyStars = 10 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i 
          key={`empty-${i}`} 
          className="bi bi-star animated-star" 
          style={{ 
            color: "#E5E7EB",
            animationDelay: `${(fullStars + (hasHalfStar ? 1 : 0) + i) * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    return stars;
  };

  const getUserTypeBadge = (userType: USER_TYPE) => {
    switch (userType) {
      case USER_TYPE.PROFESSIONAL:
        return (
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge d-flex align-items-center animated-badge" style={{ 
              padding: '8px 12px', 
              fontSize: '12px', 
              fontWeight: '600',
              background: 'linear-gradient(90deg, rgb(0, 99, 177), rgb(0, 163, 224))',
              border: 'none',
              color: 'white',
              borderRadius: '20px'
            }}>
              <i className="bi bi-award me-1" style={{ fontSize: '10px' }}></i>
              CERTIFIED
            </span>
            <span className="badge d-flex align-items-center animated-badge" style={{ 
              padding: '8px 12px', 
              fontSize: '12px', 
              fontWeight: '600',
              background: 'linear-gradient(90deg, #FFD700, #FFA500)', 
              border: 'none',
              color: 'white',
              borderRadius: '20px'
            }}>
              <i className="bi bi-patch-check-fill me-1" style={{ fontSize: '10px' }}></i>
              PRO
            </span>
          </div>
        );
      case USER_TYPE.RESELLER:
        return (
          <span className="badge d-flex align-items-center animated-badge" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '20px'
          }}>
            <i className="bi bi-shop me-1" style={{ fontSize: '10px' }}></i>
            RESELLER
          </span>
        );
      case USER_TYPE.CLIENT:
        return (
          <span className="badge d-flex align-items-center animated-badge" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
            border: 'none',
            color: 'white',
            borderRadius: '20px'
          }}>
            <i className="bi bi-person me-1" style={{ fontSize: '10px' }}></i>
            CLIENT
          </span>
        );
      default:
        return null;
    }
  };

  const getVerificationBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="badge d-flex align-items-center animated-badge" style={{ 
          padding: '8px 12px', 
          fontSize: '12px', 
          fontWeight: '600',
          background: 'linear-gradient(90deg, #10B981, #059669)',
          border: 'none',
          color: 'white',
          borderRadius: '20px'
        }}>
          <i className="bi bi-check-circle me-1" style={{ fontSize: '10px' }}></i>
          VERIFIED
        </span>
      );
    }
    return null;
  };

  // Render recommended badge - Creative design with animation
  const renderRecommendedBadge = () => {
    if (!user?.isRecommended) return null;

    return (
      <div className="position-absolute recommended-badge-large" style={{ 
        top: '15px', 
        right: '15px', 
        zIndex: 10 
      }}>
        <div className="recommended-badge-container" style={{
          position: 'relative',
          width: '105px',
          height: '40px'
        }}>
          {/* Glowing background effect */}
          <div className="recommended-glow" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
            borderRadius: '20px',
            animation: 'recommendedGlow 2s ease-in-out infinite',
            filter: 'blur(2px)',
            transform: 'scale(1.1)'
          }}></div>
          
          {/* Main badge */}
          <div className="recommended-main-badge" style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            animation: 'recommendedPulse 1.5s ease-in-out infinite',
            minWidth: '105px',
            maxWidth: '105px',
            height: '40px'
          }}>
            <i className="bi bi-star-fill me-1" style={{ 
              fontSize: '10px', 
              color: '#FFD700',
              animation: 'recommendedStar 2s ease-in-out infinite',
              flexShrink: 0
            }}></i>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '700', 
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              lineHeight: '1.2'
            }}>
              Recommended
            </span>
          </div>
          
          {/* Sparkle effects */}
          <div className="sparkle sparkle-1" style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '10px',
            height: '10px',
            background: '#FFD700',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite'
          }}></div>
          
          <div className="sparkle sparkle-2" style={{
            position: 'absolute',
            bottom: '-4px',
            left: '-4px',
            width: '8px',
            height: '8px',
            background: '#FF6B6B',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.5s'
          }}></div>
          
          <div className="sparkle sparkle-3" style={{
            position: 'absolute',
            top: '50%',
            right: '-10px',
            width: '6px',
            height: '6px',
            background: '#4ECDC4',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 1s'
          }}></div>

          {/* Additional sparkles for larger badge */}
          <div className="sparkle sparkle-4" style={{
            position: 'absolute',
            top: '-4px',
            left: '15%',
            width: '5px',
            height: '5px',
            background: '#96CEB4',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.3s'
          }}></div>
          
          <div className="sparkle sparkle-5" style={{
            position: 'absolute',
            bottom: '-6px',
            right: '25%',
            width: '6px',
            height: '6px',
            background: '#45B7D1',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.8s'
          }}></div>
        </div>
      </div>
    );
  };

  const getRecommendedBadgeForBadges = () => {
    if (!user?.isRecommended) return null;

    return (
      <span className="badge d-flex align-items-center animated-badge ms-2" style={{ 
        padding: '6px 12px', 
        fontSize: '9px', 
        fontWeight: '600',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        color: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        whiteSpace: 'nowrap',
        maxWidth: '110px',
        minWidth: '105px',
        height: '28px',
        lineHeight: '1.2'
      }}>
        <i className="bi bi-star-fill me-1" style={{ fontSize: '8px', color: '#FFD700', flexShrink: 0 }}></i>
        <span>RECOMMENDED</span>
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <AxiosInterceptor>
          <Header />
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          <Footer />
        </AxiosInterceptor>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AxiosInterceptor>
          <Header />
          <div className="container text-center py-5">
            <h2>User not found</h2>
            <button className="btn btn-primary mt-3" onClick={() => router.back()}>
              Go Back
            </button>
          </div>
          <Footer />
        </AxiosInterceptor>
      </>
    );
  }

  const avatarSrc = (user.photoURL && user.photoURL.trim() !== "") || (user.avatar && user.avatar.trim() !== "") ? (user.photoURL || user.avatar) : "/assets/images/avatar.jpg";

  return (
    <>
      <AxiosInterceptor>
        <Header />
        <main className="user-details-page" style={{ 
          minHeight: '100vh', 
          padding: '40px 0',
          position: 'relative',
          zIndex: 1,
        }}>
          <div className="container">
            {/* Add CSS for animated stars, badges, cards, and recommended effects */}
            <style>{`
              @keyframes starPulse {
                0% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
                25% {
                  transform: scale(1.2) rotate(10deg);
                  opacity: 0.8;
                }
                50% {
                  transform: scale(1.4) rotate(0deg);
                  opacity: 0.6;
                }
                75% {
                  transform: scale(1.2) rotate(-10deg);
                  opacity: 0.8;
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }

              @keyframes starTwinkle {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.6;
                  transform: scale(0.95);
                }
              }

              .animated-star {
                animation: starPulse 2s ease-in-out infinite !important;
                display: inline-block !important;
                margin: 0 2px !important;
                transition: all 0.3s ease !important;
                font-size: 16px !important;
                transform-origin: center !important;
              }

              .animated-star:hover {
                animation: starTwinkle 0.6s ease-in-out infinite !important;
                transform: scale(1.4) !important;
                filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1)) !important;
              }

              /* Badge Pop-in Animation */
              @keyframes badgePop {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }

              /* Badge Subtle Wiggle Animation (for continuous movement) */
              @keyframes badgeSubtleWiggle {
                0%, 100% { transform: rotateZ(0deg); }
                25% { transform: rotateZ(1deg); }
                75% { transform: rotateZ(-1deg); }
              }

              /* Badge Rotation Animation */
              @keyframes badgeRotateOnCardHover {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }

              /* General animated-badge styles */
              .animated-badge {
                animation: badgePop 0.5s ease-out forwards, badgeSubtleWiggle 4s ease-in-out infinite;
                transform-origin: center;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
                transform-style: preserve-3d;
              }

              /* Avatar Badges - apply similar animation properties */
              .badge-overlay {
                transform-style: preserve-3d;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
              }

              /* New rule: Apply rotation when .user-header-card is hovered */
              .user-header-card:hover .animated-badge,
              .user-header-card:hover .badge-overlay > div {
                animation: badgeRotateOnCardHover 0.6s ease-in-out forwards;
                filter: brightness(1.2);
              }

              /* Recommended Badge Animations */
              @keyframes recommendedGlow {
                0%, 100% {
                  background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4);
                  opacity: 0.8;
                  transform: scale(1.1);
                }
                50% {
                  background: linear-gradient(45deg, #96CEB4, #FF6B6B, #4ECDC4, #45B7D1);
                  opacity: 1;
                  transform: scale(1.2);
                }
              }

              @keyframes recommendedPulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }
                50% {
                  transform: scale(1.05);
                  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
                }
              }

              @keyframes recommendedStar {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  color: #FFD700;
                }
                25% {
                  transform: rotate(90deg) scale(1.2);
                  color: #FFA500;
                }
                50% {
                  transform: rotate(180deg) scale(1.1);
                  color: #FF6347;
                }
                75% {
                  transform: rotate(270deg) scale(1.2);
                  color: #FF69B4;
                }
              }

              @keyframes sparkle {
                0%, 100% {
                  opacity: 0;
                  transform: scale(0.5);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.2);
                }
              }

              /* Card Initial Load Animation */
              @keyframes cardFadeInUp {
                0% {
                  opacity: 0;
                  transform: translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .user-card.initial-animation {
                animation: cardFadeInUp 0.6s ease-out forwards;
              }

              /* Card Hover Animation for main card - removed rotation from card itself */
              .user-header-card {
                transition: all 0.4s ease;
                position: relative;
                overflow: visible;
              }
              .user-header-card:hover {
                transform: translateY(-15px) scale(1.02) !important;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3) !important;
                background-color: white !important;
              }

              /* Stat Card Hover Animation */
              .stat-card-hover:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
              }
            `}</style>
            
            {/* Back Button */}
            <div className="mb-4">
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={() => router.back()}
                style={{ borderRadius: '25px', padding: '8px 20px' }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Users
              </button>
            </div>

            {/* User Header Card */}
            <div
              className="card mb-4 user-header-card"
              style={{
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              {/* Recommended Badge */}
              {renderRecommendedBadge()}

              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-3 text-center mb-3 mb-md-0">
                    <div className="position-relative d-inline-block">
                      <div className="user-avatar" style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: user.isRecommended ? '4px solid #667eea' : '4px solid #fff',
                        boxShadow: user.isRecommended ? '0 4px 15px rgba(102, 126, 234, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'
                      }}>
                        <img
                          src={avatarSrc}
                          alt={getUserFullName(user)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/assets/images/avatar.jpg";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-9">
                    <div className="d-flex flex-wrap align-items-center mb-2">
                      <h2 className="mb-0 me-3" style={{ fontWeight: '700', color: '#333', display: 'inline-flex', alignItems: 'center' }}>
                        {getUserFullName(user)}
                      </h2>
                      {getUserTypeBadge(user.type)}
                      {getVerificationBadge(user.verificationStatus || 'unverified')}
                      {getRecommendedBadgeForBadges()}
                    </div>

                    {user.isRecommended && (
                      <div className="mb-3">
                        <div className="alert alert-info d-flex align-items-center" style={{ 
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: '15px',
                          padding: '12px 16px'
                        }}>
                          <i className="bi bi-star-fill me-2" style={{ color: '#FFD700', fontSize: '18px' }}></i>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#667eea' }}>
                            This is a top-rated user recommended by our community!
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-muted mb-2" style={{ fontSize: '16px' }}>
                      <i className="bi bi-envelope me-2"></i>
                      {user.email}
                    </p>

                    {user.phone && (
                      <p className="text-muted mb-2" style={{ fontSize: '16px' }}>
                        <i className="bi bi-telephone me-2"></i>
                        {user.phone}
                      </p>
                    )}

                    {user.location && (
                      <p className="text-muted mb-3" style={{ fontSize: '16px' }}>
                        <i className="bi bi-geo-alt me-2"></i>
                        {user.location}
                      </p>
                    )}

                    <div className="user-rating mb-3">
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{ fontSize: '16px', fontWeight: '500' }}>Rating:</span>
                        <div className="d-flex align-items-center">
                          {renderStars(user.rating)}
                          <span className="ms-2" style={{ fontSize: '16px', fontWeight: '600', color: '#0063b1' }}>
                            {user.rating.toFixed(1)} / 10
                          </span>
                          {user.isRecommended && (
                            <i className="bi bi-star-fill ms-2" style={{ color: '#FFD700', fontSize: '16px' }} title="Recommended User"></i>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                      <i className="bi bi-calendar-check me-2"></i>
                      Member since {new Date(user.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {user.description && (
                      <p className="text-muted" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        &quot;{user.description}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div
                  className="card h-100 text-center stat-card-hover"
                  style={{
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="card-body">
                    <i className="bi bi-hammer" style={{ fontSize: '2.5rem', color: '#0063b1', marginBottom: '10px' }}></i>
                    <h3 className="mb-1" style={{ fontWeight: '700', color: '#0063b1' }}>{user.totalBids}</h3>
                    <p className="text-muted mb-0">Total Bids</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div
                  className="card h-100 text-center stat-card-hover"
                  style={{
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="card-body">
                    <i className="bi bi-trophy" style={{ fontSize: '2.5rem', color: '#28a745', marginBottom: '10px' }}></i>
                    <h3 className="mb-1" style={{ fontWeight: '700', color: '#28a745' }}>{user.winningBids}</h3>
                    <p className="text-muted mb-0">Won Bids</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div
                  className="card h-100 text-center stat-card-hover"
                  style={{
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="card-body">
                    <i className="bi bi-percent" style={{ fontSize: '2.5rem', color: '#ffc107', marginBottom: '10px' }}></i>
                    <h3 className="mb-1" style={{ fontWeight: '700', color: '#ffc107' }}>
                      {user.totalBids > 0 ? ((user.winningBids / user.totalBids) * 100).toFixed(1) : '0'}%
                    </h3>
                    <p className="text-muted mb-0">Success Rate</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div
                  className="card h-100 text-center stat-card-hover"
                  style={{
                    borderRadius: '15px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="card-body">
                    <i className="bi bi-collection" style={{ fontSize: '2.5rem', color: '#6f42c1', marginBottom: '10px' }}></i>
                    <h3 className="mb-1" style={{ fontWeight: '700', color: '#6f42c1' }}>{user.totalAuctions || 0}</h3>
                    <p className="text-muted mb-0">
                      {user.type === USER_TYPE.CLIENT ? 'Participated' : 'Created'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="card" style={{ 
              borderRadius: '20px', 
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="card-header bg-white" style={{ padding: '0', borderBottom: '1px solid #eee', borderRadius: '20px 20px 0 0' }}>
                <ul className="nav nav-tabs" style={{ borderBottom: 'none', padding: '20px 20px 0 20px' }}>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('overview')}
                      style={{
                        padding: '12px 20px',
                        fontWeight: activeTab === 'overview' ? '600' : '400',
                        color: activeTab === 'overview' ? '#0063b1' : '#666',
                        borderBottom: activeTab === 'overview' ? '3px solid #0063b1' : 'none',
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-person-circle me-2"></i>
                      Overview
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                      onClick={() => setActiveTab('activity')}
                      style={{
                        padding: '12px 20px',
                        fontWeight: activeTab === 'activity' ? '600' : '400',
                        color: activeTab === 'activity' ? '#0063b1' : '#666',
                        borderBottom: activeTab === 'activity' ? '3px solid #0063b1' : 'none',
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-activity me-2"></i>
                      Activity
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'auctions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('auctions')}
                      style={{
                        padding: '12px 20px',
                        fontWeight: activeTab === 'auctions' ? '600' : '400',
                        color: activeTab === 'auctions' ? '#0063b1' : '#666',
                        borderBottom: activeTab === 'auctions' ? '3px solid #0063b1' : 'none',
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-hammer me-2"></i>
                      Auctions
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                      onClick={() => setActiveTab('reviews')}
                      style={{
                        padding: '12px 20px',
                        fontWeight: activeTab === 'reviews' ? '600' : '400',
                        color: activeTab === 'reviews' ? '#0063b1' : '#666',
                        borderBottom: activeTab === 'reviews' ? '3px solid #0063b1' : 'none',
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-star me-2"></i>
                      Reviews
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body" style={{ padding: '30px' }}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="row">
                      <div className="col-md-8">
                        <h5 className="mb-4">Profile Information</h5>
                        <div className="profile-info">
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <strong>Full Name:</strong>
                            </div>
                            <div className="col-sm-8">
                              {getUserFullName(user)}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <strong>Email:</strong>
                            </div>
                            <div className="col-sm-8">
                              {user.email}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <strong>User Type:</strong>
                            </div>
                            <div className="col-sm-8">
                              {getUserTypeBadge(user.type)}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <strong>Join Date:</strong>
                            </div>
                            <div className="col-sm-8">
                              {new Date(user.joinDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          {user.phone && (
                            <div className="row mb-3">
                              <div className="col-sm-4">
                                <strong>Phone:</strong>
                              </div>
                              <div className="col-sm-8">
                                {user.phone}
                              </div>
                            </div>
                          )}
                          {user.location && (
                            <div className="row mb-3">
                              <div className="col-sm-4">
                                <strong>Location:</strong>
                              </div>
                              <div className="col-sm-8">
                                {user.location}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <h5 className="mb-4">Rating Overview</h5>
                        <div className="rating-overview text-center">
                          <div className="rating-score mb-3">
                            <h2 style={{ fontSize: '3rem', fontWeight: '700', color: '#0063b1' }}>
                              {user.rating.toFixed(1)}<span style={{ fontSize: '1.5rem', color: '#666' }}>/10</span>
                            </h2>
                            <div className="stars mb-2">
                              {renderStars(user.rating)}
                            </div>
                            <p className="text-muted">Overall Rating</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="activity-tab">
                    <h5 className="mb-4">Recent Activity</h5>
                    {user.history.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-activity" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                        <p className="text-muted mt-3">No activity history available.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                              <th>Date</th>
                              <th>Action</th>
                              <th>Item</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.history.map((item, index) => (
                              <tr key={index}>
                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                <td>
                                  <i className="bi bi-hammer me-2"></i>
                                  {item.action}
                                </td>
                                <td>{item.itemName}</td>
                                <td className="fw-bold">${item.amount.toFixed(2)}</td>
                                <td>
                                  <span className={`badge ${item.status === 'Won' ? 'bg-success' : 'bg-danger'}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Auctions Tab */}
                {activeTab === 'auctions' && (
                  <div className="auctions-tab">
                    <h5 className="mb-4">
                      {user.type === USER_TYPE.CLIENT ? 'Auction Participation' : 'Created Auctions'}
                    </h5>
                    <div className="text-center py-5">
                      <i className="bi bi-hammer" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                      <p className="text-muted mt-3">
                        {user.type === USER_TYPE.CLIENT
                          ? 'Auction participation details will be displayed here.'
                          : 'Created auction details will be displayed here.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="reviews-tab">
                    <h5 className="mb-4">User Reviews</h5>
                    <div className="text-center py-5">
                      <i className="bi bi-star" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                      <p className="text-muted mt-3">User reviews and feedback will be displayed here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </AxiosInterceptor>
    </>
  );
}