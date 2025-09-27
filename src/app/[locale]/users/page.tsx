"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import useAuth from '@/hooks/useAuth';
import { UserAPI, USER_TYPE } from "@/app/api/users";
import { extractErrorMessage, isRetryableError } from '@/types/Error';

// Define user type based on real data structure
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  type: USER_TYPE;
  role?: string;
  rate: number;
  createdAt: string;
  totalBids?: number;
  winningBids?: number;
  phone?: string;
  location?: string;
  isVerified?: boolean;
  lastActive?: string;
  joinDate: string;
  isRecommended?: boolean; // Added for recommended feature
}

interface ApiUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  avatar?: { url?: string };
  type: USER_TYPE;
  role?: string;
  rate?: number;
  createdAt?: string;
  totalBids?: number;
  winningBids?: number;
  phone?: string;
  location?: string;
  isVerified?: boolean;
  lastActive?: string;
  isRecommended?: boolean; // Added for recommended feature
}

export default function UsersPage() {
  const { initializeAuth } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUserType, setActiveUserType] = useState<USER_TYPE>(USER_TYPE.PROFESSIONAL);
  const [error, setError] = useState<{ hasError: boolean; message: string; canRetry: boolean }>({ hasError: false, message: "", canRetry: false });
  const [retryCount, setRetryCount] = useState(0);

  // New state variables for counts
  const [professionalCount, setProfessionalCount] = useState(0);
  const [resellerCount, setResellerCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  const fetchUsers = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      setError({ hasError: false, message: "", canRetry: false });

      // Fetch all user types concurrently along with recommended ones
      const [professionalsResponse, resellersResponse, clientsResponse] = await Promise.all([
        UserAPI.getProfessionals(),
        UserAPI.getResellers(),
        UserAPI.getClients()
      ]);

      // Fetch recommended users separately with error handling
      let recommendedProfessionals: any[] = [];
      let recommendedResellers: any[] = [];
      
      try {
        if (UserAPI.getRecommendedProfessionals) {
          const recProfs = await UserAPI.getRecommendedProfessionals();
          recommendedProfessionals = Array.isArray(recProfs) ? recProfs : (recProfs?.data || []);
        }
      } catch (error) {
        console.warn('Failed to fetch recommended professionals:', error);
      }

      try {
        if (UserAPI.getRecommendedResellers) {
          const recResellers = await UserAPI.getRecommendedResellers();
          recommendedResellers = Array.isArray(recResellers) ? recResellers : (recResellers?.data || []);
        }
      } catch (error) {
        console.warn('Failed to fetch recommended resellers:', error);
      }

      // Update individual counts
      setProfessionalCount((professionalsResponse as any).length || (professionalsResponse as any).data?.length || 0);
      setResellerCount((resellersResponse as any).length || (resellersResponse as any).data?.length || 0);
      setClientCount((clientsResponse as any).length || (clientsResponse as any).data?.length || 0);

      let currentUsersData: ApiUser[] = [];

      // Determine which data set to use for current display based on activeUserType
      if (activeUserType === USER_TYPE.PROFESSIONAL) {
        currentUsersData = Array.isArray(professionalsResponse) ? (professionalsResponse as ApiUser[]) : ((professionalsResponse as any).data || []);
      } else if (activeUserType === USER_TYPE.RESELLER) {
        currentUsersData = Array.isArray(resellersResponse) ? (resellersResponse as ApiUser[]) : ((resellersResponse as any).data || []);
      } else if (activeUserType === USER_TYPE.CLIENT) {
        currentUsersData = Array.isArray(clientsResponse) ? (clientsResponse as ApiUser[]) : ((clientsResponse as any).data || []);
      }

      // Mark recommended users in the full list
      const recommendedProfIds = recommendedProfessionals.map((u: any) => u._id);
      const recommendedResellerIds = recommendedResellers.map((u: any) => u._id);

      currentUsersData = currentUsersData.map(user => ({
        ...user,
        isRecommended: (activeUserType === USER_TYPE.PROFESSIONAL && recommendedProfIds.includes(user._id)) ||
                      (activeUserType === USER_TYPE.RESELLER && recommendedResellerIds.includes(user._id))
      }));

      // Transform API data to match our User interface for the currently active type
      const transformedUsers = currentUsersData.map((user: ApiUser) => ({
        _id: user._id,
        firstName: user.firstName || 'Unknown',
        lastName: user.lastName || '',
        email: user.email || 'No email',
        avatar: user.photoURL || user.avatar?.url,
        photoURL: user.photoURL,
        type: user.type,
        role: user.role,
        rate: typeof user.rate === 'number' ? user.rate : 0,
        createdAt: user.createdAt || new Date().toISOString(),
        joinDate: user.createdAt || new Date().toISOString(),
        totalBids: user.totalBids || 0,
        winningBids: user.winningBids || 0,
        phone: user.phone,
        location: user.location,
        isVerified: Boolean(user.isVerified),
        lastActive: user.lastActive || new Date().toISOString(),
        isRecommended: Boolean(user.isRecommended)
      }));

      console.log('Transformed users with recommended status:', transformedUsers.filter(u => u.isRecommended));
      setUsers(transformedUsers);

      if (isRetry) {
        setRetryCount(0);
      }
    } catch (error: unknown) {
      console.error("Error fetching users:", error);

      const errorMessage = extractErrorMessage(error) || "Failed to load users";
      const canRetry = isRetryableError(error);

      setError({
        hasError: true,
        message: errorMessage,
        canRetry
      });

      // Only set empty array if it's not a retry
      if (!isRetry) {
        setUsers([]);
        // Also reset counts on error if initial fetch fails
        setProfessionalCount(0);
        setResellerCount(0);
        setClientCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeUserType]);

  useEffect(() => {
    initializeAuth();
    fetchUsers();
  }, [activeUserType, initializeAuth, fetchUsers]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchUsers(true);
  };

  const getUserFullName = (user: User): string => {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = getUserFullName(user).toLowerCase();
    const email = user.email.toLowerCase();
    const userType = user.type?.toLowerCase() || '';

    return fullName.includes(searchLower) ||
           email.includes(searchLower) ||
           userType.includes(searchLower);
  });

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
            animationDelay: `${i * 0.1}s`,
            display: 'inline-block',
            fontSize: '12px'
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
            animationDelay: `${fullStars * 0.1}s`,
            display: 'inline-block',
            fontSize: '12px'
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
            animationDelay: `${(fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1}s`,
            display: 'inline-block',
            fontSize: '12px'
          }}
        ></i>
      );
    }

    return stars;
  };

  const getUserTypeInfo = (userType: USER_TYPE) => {
    switch (userType) {
      case USER_TYPE.PROFESSIONAL:
        return {
          badge: (
            <div className="d-flex justify-content-center align-items-center flex-wrap gap-2">
              {/* Certified Badge */}
              <span className="badge d-flex align-items-center animated-badge" style={{
                fontSize: '11px',
                padding: '6px 12px',
                background: 'linear-gradient(90deg, rgb(0, 99, 177), rgb(0, 163, 224))',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                borderRadius: '20px'
              }}>
                <i className="bi bi-award me-1" style={{ fontSize: '10px' }}></i>
                CERTIFIED
              </span>
              {/* Pro Badge */}
              <span className="badge d-flex align-items-center animated-badge" style={{
                fontSize: '11px',
                padding: '6px 12px',
                background: 'linear-gradient(90deg, #FFD700, #FFA500)', 
                border: 'none',
                color: 'white',
                fontWeight: '600',
                borderRadius: '20px'
              }}>
                <i className="bi bi-patch-check-fill me-1" style={{ fontSize: '10px' }}></i>
                PRO
              </span>
            </div>
          ),
          avatarBadges: (
            <>
              {/* Certified Avatar Badge (top-right) */}
              <div className="position-absolute avatar-badge-creative" style={{ top: '-2px', right: '-2px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, rgb(0, 99, 177), rgb(0, 163, 224))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
                }}>
                  <i className="bi bi-award text-white" style={{ fontSize: '10px' }}></i>
                </div>
              </div>
              {/* Pro Avatar Badge (top-left) */}
              <div className="position-absolute avatar-badge-creative" style={{ top: '-2px', left: '-2px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)', // Gold/Orange gradient for Pro
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(255, 215, 0, 0.3)'
                }}>
                  <i className="bi bi-patch-check-fill text-white" style={{ fontSize: '10px' }}></i>
                </div>
              </div>
            </>
          ),
          color: '#0063B1' 
        };
      case USER_TYPE.RESELLER:
        return {
          badge: (
            <span className="badge d-flex align-items-center animated-badge" style={{
              fontSize: '11px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              borderRadius: '20px'
            }}>
              <i className="bi bi-shop me-1" style={{ fontSize: '10px' }}></i>
              RESELLER
            </span>
          ),
          avatarBadges: (
            <div className="position-absolute avatar-badge-creative" style={{ top: '-2px', right: '-2px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
              }}>
                <i className="bi bi-shop text-white" style={{ fontSize: '10px' }}></i>
              </div>
            </div>
          ),
          color: '#F59E0B'
        };
      case USER_TYPE.CLIENT:
        return {
          badge: (
            <span className="badge d-flex align-items-center animated-badge" style={{
              fontSize: '11px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              borderRadius: '20px'
            }}>
              <i className="bi bi-person me-1" style={{ fontSize: '10px' }}></i>
              CLIENT
            </span>
          ),
          avatarBadges: null,
          color: '#3B82F6'
        };
      default:
        return { badge: null, avatarBadges: null, color: '#6B7280' };
    }
  };

  // Render recommended badge - Creative design with animation
  const renderRecommendedBadge = (user: User) => {
    if (!user.isRecommended) return null;

    console.log('Rendering recommended badge for user:', user.firstName, user._id);

    return (
      <div className="position-absolute recommended-badge" style={{ 
        top: '10px', 
        left: '10px', 
        zIndex: 10 
      }}>
        <div className="recommended-badge-container" style={{
          position: 'relative',
          width: '60px',
          height: '30px'
        }}>
          {/* Glowing background effect */}
          <div className="recommended-glow" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
            borderRadius: '15px',
            animation: 'recommendedGlow 2s ease-in-out infinite',
            filter: 'blur(2px)',
            transform: 'scale(1.1)'
          }}></div>
          
          {/* Main badge */}
          <div className="recommended-main-badge" style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            animation: 'recommendedPulse 1.5s ease-in-out infinite'
          }}>
            <i className="bi bi-star-fill me-1" style={{ 
              fontSize: '10px', 
              color: '#FFD700',
              animation: 'recommendedStar 2s ease-in-out infinite'
            }}></i>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '700', 
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Recommended
            </span>
          </div>
          
          {/* Sparkle effects */}
          <div className="sparkle sparkle-1" style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '8px',
            height: '8px',
            background: '#FFD700',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite'
          }}></div>
          
          <div className="sparkle sparkle-2" style={{
            position: 'absolute',
            bottom: '-3px',
            left: '-3px',
            width: '6px',
            height: '6px',
            background: '#FF6B6B',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.5s'
          }}></div>
          
          <div className="sparkle sparkle-3" style={{
            position: 'absolute',
            top: '50%',
            right: '-8px',
            width: '4px',
            height: '4px',
            background: '#4ECDC4',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 1s'
          }}></div>
        </div>
      </div>
    );
  };

  const getFilterButtonStyle = (isActive: boolean, userType: USER_TYPE) => {
    const baseStyle = {
      borderRadius: '25px',
      padding: '12px 24px',
      margin: '0 8px 8px 0',
      border: '2px solid',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    if (isActive) {
      if (userType === USER_TYPE.PROFESSIONAL) {
        return { ...baseStyle, backgroundColor: '#0063B1', borderColor: '#0063B1', color: 'white' }; 
      } else if (userType === USER_TYPE.RESELLER) {
        return { ...baseStyle, backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: 'white' };
      } else if (userType === USER_TYPE.CLIENT) {
        return { ...baseStyle, backgroundColor: '#3B82F6', borderColor: '#3B82F6', color: 'white' };
      }
    } else {
      return { ...baseStyle, backgroundColor: 'white', borderColor: '#E5E7EB', color: '#6B7280', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' };
    }
  };

  const renderErrorState = () => (
    <div className="text-center py-5">
      <div className="card" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        border: '1px solid #FEE2E2'
      }}>
        <i className="bi bi-exclamation-triangle text-danger mb-3" style={{ fontSize: '3rem' }}></i>
        <h4 className="text-danger mb-2">Error Loading Users</h4>
        <p className="text-muted mb-3">{error.message}</p>
        {error.canRetry && (
          <>
            <button
              className="btn btn-primary me-2"
              onClick={handleRetry}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Retrying...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Retry
                </>
              )}
            </button>
            {retryCount > 0 && (
              <small className="text-muted d-block mt-2">
                Retry attempt: {retryCount}
              </small>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-5">
      <div className="mb-4">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      <h4 className="text-muted mb-2">Loading Community Members</h4>
      <p className="text-muted">Please wait while we fetch the latest user data...</p>

      {/* Loading skeleton cards */}
      <div className="row mt-4">
        {[1, 2, 3, 4].map(index => (
          <div key={index} className="col-xl-3 col-lg-4 col-md-6 mb-4">
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '30px 25px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              height: '350px',
              animation: 'pulse 1.5s ease-in-out infinite alternate'
            }}>
              <div className="text-center">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                  margin: '0 auto 20px'
                }}></div>
                <div style={{ height: '20px', backgroundColor: '#E5E7EB', borderRadius: '10px', marginBottom: '10px' }}></div>
                <div style={{ height: '15px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '20px', width: '60%', margin: '10px auto 20px' }}></div>
                <div style={{ height: '40px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );

  const handleUserClick = (userId: string) => {
    // Use proper Next.js navigation
    console.log('Navigating to user:', userId);
    router.push(`/users/${userId}`);
  };

  return (
    <>
      <AxiosInterceptor>
        <Header />
        <main className="users-page-wrapper" style={{
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          padding: '60px 0'
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
                margin: 0 1px !important;
                transition: all 0.3s ease !important;
                font-size: 12px !important;
                transform-origin: center !important;
              }

              .animated-star:hover {
                animation: starTwinkle 0.6s ease-in-out infinite !important;
                transform: scale(1.4) !important;
                filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1)) !important;
              }

              @keyframes pulse {
                0% { opacity: 1; }
                100% { opacity: 0.4; }
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

              .animated-badge {
                animation: badgePop 0.5s ease-out forwards, badgeSubtleWiggle 4s ease-in-out infinite;
                transform-origin: center;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
                transform-style: preserve-3d;
              }

              .animated-badge:hover {
                filter: brightness(1.2);
              }

              .avatar-badge-creative {
                transform-style: preserve-3d;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
              }

              /* Apply rotation animation to animated badges and avatar badges when the user card is hovered */
              .user-card:hover .animated-badge,
              .user-card:hover .avatar-badge-creative {
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
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                50% {
                  transform: scale(1.05);
                  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
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

              /* Card Hover Animation */
              .user-card:hover {
                transform: translateY(-15px) rotateZ(-2deg) scale(1.05) !important;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3) !important;
                background-color: white !important;
              }
            `}</style>

            {/* Hero Section */}
            <div className="text-center mb-5">
              <h1 className="display-4 mb-4" style={{
                fontWeight: '700',
                background: 'linear-gradient(90deg, rgb(0, 99, 177), rgb(0, 163, 224))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Discover Our Community
              </h1>
              <p className="lead text-muted mb-5" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                Connect with professionals, resellers, and clients who make our auction marketplace thrive
              </p>

              {/* User Type Filters */}
              <div className="filter-tabs mb-5 d-flex flex-wrap justify-content-center">
                <button
                  onClick={() => setActiveUserType(USER_TYPE.PROFESSIONAL)}
                  style={getFilterButtonStyle(activeUserType === USER_TYPE.PROFESSIONAL, USER_TYPE.PROFESSIONAL)}
                  className="btn"
                  disabled={loading}
                >
                  <i className="bi bi-award me-2"></i>
                  Professionals ({professionalCount})
                </button>
                <button
                  onClick={() => setActiveUserType(USER_TYPE.RESELLER)}
                  style={getFilterButtonStyle(activeUserType === USER_TYPE.RESELLER, USER_TYPE.RESELLER)}
                  className="btn"
                  disabled={loading}
                >
                  <i className="bi bi-briefcase me-2"></i>
                  Resellers ({resellerCount})
                </button>
                <button
                  onClick={() => setActiveUserType(USER_TYPE.CLIENT)}
                  style={getFilterButtonStyle(activeUserType === USER_TYPE.CLIENT, USER_TYPE.CLIENT)}
                  className="btn"
                  disabled={loading}
                >
                  <i className="bi bi-person me-2"></i>
                  Clients ({clientCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="search-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div className="input-group" style={{ borderRadius: '50px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or user type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    style={{
                      padding: '16px 24px',
                      border: 'none',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  />
                  <button className="btn" style={{
                    backgroundColor: 'rgb(0, 99, 177)',
                    border: 'none',
                    padding: '0 30px',
                    color: 'white'
                  }}>
                    <i className="bi bi-search" style={{ fontSize: '18px' }}></i>
                  </button>
                </div>
                {searchTerm && (
                  <div className="mt-2 text-start">
                    <small className="text-muted">
                      Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
                      {filteredUsers.length > 0 && (
                        <button
                          className="btn btn-link btn-sm p-0 ms-2 text-decoration-none"
                          onClick={() => setSearchTerm("")}
                        >
                          <i className="bi bi-x-circle"></i> Clear
                        </button>
                      )}
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* Temporary Testing Section - Add this for debugging */}
            {!loading && !error.hasError && (
              <div className="mb-4 p-3 bg-info-subtle border border-info rounded">
                <h6>Debug Info:</h6>
                <p>Total users: {users.length}</p>
                <p>Recommended users: {users.filter(u => u.isRecommended).length}</p>
                <p>User IDs with recommended status: {users.filter(u => u.isRecommended).map(u => u._id).join(', ') || 'None'}</p>
              </div>
            )}

            {/* Users Grid */}
            <div className="users-grid">
              {error.hasError ? renderErrorState() : loading ? renderLoadingState() : filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="card" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '500px',
                    margin: '0 auto',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                  }}>
                    <i className="bi bi-search text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <h4 className="text-muted mb-2">
                      {searchTerm ? 'No matching users found' : 'No users found'}
                    </h4>
                    <p className="text-muted">
                      {searchTerm
                        ? 'Try adjusting your search criteria or clearing the search filter'
                        : 'There are currently no users of this type in the system'
                      }
                    </p>
                    {searchTerm && (
                      <button
                        className="btn btn-outline-primary mt-2"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="row">
                  {filteredUsers.map((user, index) => {
                    const userTypeInfo = getUserTypeInfo(user.type);
                    console.log('Rendering user card for:', user.firstName, 'isRecommended:', user.isRecommended);
                    return (
                      <div key={user._id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                        <div
                          className={`user-card initial-animation`}
                          onClick={() => handleUserClick(user._id)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '20px',
                            padding: '30px 25px',
                            cursor: 'pointer',
                            transition: 'all 0.4s ease',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            animationDelay: `${index * 0.1}s`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-15px) rotateZ(-2deg) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.3)';
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) rotateZ(0deg) scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                          }}
                        >
                          {/* Recommended Badge */}
                          {renderRecommendedBadge(user)}

                          {/* Background Pattern */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100px',
                            height: '100px',
                            background: `linear-gradient(135deg, ${userTypeInfo.color}20, transparent)`,
                            borderRadius: '0 20px 0 100px'
                          }}></div>

                          {/* User Avatar */}
                          <div className="text-center mb-3">
                            <div className="position-relative d-inline-block">
                              <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `3px solid ${userTypeInfo.color}`,
                                boxShadow: `0 4px 15px ${userTypeInfo.color}30`,
                                position: 'relative'
                              }}>
                                <img
                                  src={user.photoURL || user.avatar || "/assets/images/avatar.jpg"}
                                  alt={getUserFullName(user)}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/assets/images/avatar.jpg";
                                  }}
                                />
                              </div>

                              {/* Avatar Badges (Certified and Pro) */}
                              {userTypeInfo.avatarBadges && (
                                <>
                                  {userTypeInfo.avatarBadges}
                                </>
                              )}
                            </div>
                          </div>

                          {/* User Info */}
                          <div className="text-center">
                            <h5 className="mb-1" style={{ fontWeight: '700', color: '#1F2937', fontSize: '18px', display: 'inline-flex', alignItems: 'center' }}>
                              {getUserFullName(user)}
                              {/* Verification Badge beside the name */}
                              {user.isVerified && (
                                <span style={{
                                  display: 'inline-flex',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: '#10B981',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                                  marginLeft: '8px',
                                  flexShrink: 0
                                }}>
                                  <i className="bi bi-check text-white" style={{ fontSize: '10px', fontWeight: 'bold' }}></i>
                                </span>
                              )}
                            </h5>

                            <div className="d-flex justify-content-center mb-3">
                              {userTypeInfo.badge}
                            </div>

                            {/* Rating */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-center align-items-center mb-1">
                                {renderStars(user.rate)}
                              </div>
                              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                                {user.rate.toFixed(1)} / 10
                              </span>
                            </div>

                            {/* Stats */}
                            <div className="row text-center">
                              <div className="col-6">
                                <div style={{
                                  padding: '12px 8px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  borderRadius: '12px',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{ fontSize: '18px', fontWeight: '700', color: userTypeInfo.color }}>
                                    {user.totalBids || 0}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                                    Total Bids
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div style={{
                                  padding: '12px 8px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  borderRadius: '12px',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>
                                    {user.winningBids || 0}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                                    Won Bids
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Join Date */}
                            <div className="mt-3" style={{ fontSize: '12px', color: '#9CA3AF' }}>
                              <i className="bi bi-calendar3 me-1"></i>
                              Joined {new Date(user.joinDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats Section */}
            {!error.hasError && !loading && users.length > 0 && (
              <div className="stats-section mt-5">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="stat-card text-center" style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      padding: '30px 20px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <i className="bi bi-people mb-3" style={{ fontSize: '2.5rem', color: '#6366f1' }}></i>
                      <h3 className="mb-1" style={{ fontWeight: '700', color: '#1f2937' }}>
                        {professionalCount + resellerCount + clientCount}
                      </h3>
                      <p className="text-muted mb-0">Total Members</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="stat-card text-center" style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      padding: '30px 20px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <i className="bi bi-award mb-3" style={{ fontSize: '2.5rem', color: '#0063B1' }}></i>
                      <h3 className="mb-1" style={{ fontWeight: '700', color: '#1f2937' }}>
                        {professionalCount}
                      </h3>
                      <p className="text-muted mb-0">Professionals</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="stat-card text-center" style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      padding: '30px 20px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <i className="bi bi-briefcase mb-3" style={{ fontSize: '2.5rem', color: '#F59E0B' }}></i>
                      <h3 className="mb-1" style={{ fontWeight: '700', color: '#1f2937' }}>
                        {resellerCount}
                      </h3>
                      <p className="text-muted mb-0">Resellers</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="stat-card text-center" style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      padding: '30px 20px',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <i className="bi bi-person mb-3" style={{ fontSize: '2.5rem', color: '#3B82F6' }}></i>
                      <h3 className="mb-1" style={{ fontWeight: '700', color: '#1f2937' }}>
                        {clientCount}
                      </h3>
                      <p className="text-muted mb-0">Clients</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </AxiosInterceptor>
    </>
  );
}