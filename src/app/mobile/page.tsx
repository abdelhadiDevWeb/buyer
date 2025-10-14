"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { getSellerUrl, getFrontendUrl } from '@/config';
import { CategoryAPI } from '@/app/api/category';
import MobileLiveAuctions from "@/components/live-auction/MobileLiveAuctions";
import Home1LiveTenders from "@/components/live-tenders/Home1LiveTenders";
import Header from "@/components/header/Header";
import useAuth from '@/hooks/useAuth';
import { SnackbarProvider } from 'notistack';
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import RequestProvider from "@/contexts/RequestContext";

export default function MobilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { initializeAuth, isLogged, auth } = useAuth();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // State for category search
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
    
    // Navigate to category page
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    const categoryUrl = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
    
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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
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

  const handleBuyButton = () => {
    // Redirect to seller URL for buying/auctioning in the same page
    window.location.href = getSellerUrl();
  };

  const handleSellButton = () => {
    // Redirect to frontend URL for selling/creating in the same page
    window.location.href = getFrontendUrl();
  };

  return (
    <>
      <style jsx global>{`
        /* Mobile-optimized global styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-color, #1f2937);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          overflow-x: hidden;
          scroll-behavior: smooth;
          width: 100%;
          max-width: 100vw;
          margin: 0;
          padding: 0;
        }

        /* Mobile-specific variables */
        :root {
          --primary-color: #0063b1;
          --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 12%, #334155 24%, #1e3a8a 36%, #1e40af 48%, #2563eb 60%, #3b82f6 72%, #60a5fa 84%, #93c5fd 96%, #dbeafe 100%);
          --secondary-color: #0ea5e9;
          --text-color: #1f2937;
          --bg-color: #ffffff;
          --shadow-sm: 0 2px 8px rgba(30, 64, 175, 0.08);
          --shadow-md: 0 4px 20px rgba(30, 64, 175, 0.12);
          --shadow-lg: 0 8px 30px rgba(30, 64, 175, 0.16);
          --shadow-xl: 0 12px 40px rgba(30, 64, 175, 0.2);
          --transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --border-radius: 16px;
          --border-radius-lg: 24px;
        }

        .container-mobile {
          width: 100%;
          max-width: 100vw;
          margin: 0 auto;
          padding: 0 16px;
          overflow-x: hidden;
        }

        /* Mobile animations */
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

        /* Mobile button styles */
        .mobile-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px 32px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          transition: var(--transition);
          cursor: pointer;
          border: none;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          min-height: 56px;
          width: 100%;
          max-width: 280px;
        }

        .mobile-btn-primary {
          background: var(--primary-gradient);
          background-size: 200% 200%;
          color: white;
          box-shadow: var(--shadow-lg);
        }

        .mobile-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: var(--shadow-xl);
        }

        .mobile-btn-secondary {
          background: rgba(255, 255, 255, 0.95);
          color: var(--primary-color);
          box-shadow: var(--shadow-md);
          border: 2px solid var(--primary-color);
        }

        .mobile-btn-secondary:hover {
          background: var(--primary-color);
          color: white;
          transform: translateY(-3px) scale(1.02);
        }

        /* Mobile section spacing */
        .mobile-section {
          padding: 32px 0;
          position: relative;
        }

        .mobile-section-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-color);
          text-align: center;
          margin-bottom: 24px;
          padding: 0 16px;
        }

        /* Enhanced mobile responsiveness */
        @media (max-width: 480px) {
          .container-mobile {
            padding: 0 12px;
          }
          
          .mobile-btn {
            padding: 16px 24px;
            font-size: 15px;
            min-height: 52px;
          }
          
          .mobile-section-title {
            font-size: 22px;
          }
        }

        @media (max-width: 375px) {
          .container-mobile {
            padding: 0 8px;
          }
          
          .mobile-btn {
            padding: 14px 20px;
            font-size: 14px;
            min-height: 48px;
          }
        }

        /* Mobile scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--primary-gradient);
          border-radius: 10px;
        }
      `}</style>

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
              
              {/* Mobile Hero Banner Section */}
              <section 
                className="mobile-section"
                style={{ 
                  minHeight: '100vh',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(40px, 8vw, 80px) 0',
                  width: '100%',
                  maxWidth: '100vw',
                }}
              >
                {/* Mobile Gradient Background */}
                <div 
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
                    zIndex: 1,
                  }}
                />
                
                {/* Mobile Overlay */}
                <div 
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

                {/* Mobile Content */}
                <div className="container-mobile" style={{
                  position: 'relative',
                  zIndex: 3,
                  textAlign: 'center',
                  color: 'white',
                  width: '100%',
                }}>
                  
                  {/* Mobile Category Search */}
                  <div 
                    className="search-container"
                    style={{
                      position: 'relative',
                      maxWidth: '400px',
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
                      </div>
                    </form>

                    {/* Mobile Search Results Dropdown */}
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
                          maxHeight: '250px',
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile Main Headline */}
                  <h1 
                    style={{
                      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                      fontWeight: '900',
                      lineHeight: '1.1',
                      marginBottom: '24px',
                      marginTop: '32px',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                      padding: '0 16px',
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

                  {/* Mobile Subtitle */}
                  <p 
                    style={{
                      fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.6',
                      marginBottom: '40px',
                      marginTop: '20px',
                      maxWidth: '600px',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                      padding: '0 20px',
                    }}
                  >
                    Découvrez Mazad Click, la première application B2B d'enchères et de soumissions dédiée aux entreprises algériennes.
                    <br /><br />
                    Une solution moderne pour acheter, vendre et collaborer plus vite, en toute transparence.
                  </p>
                </div>
              </section>

              {/* Mobile Live Auctions Section */}
              <section className="mobile-section" style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                position: 'relative',
                zIndex: 2,
              }}>
                <div className="container-mobile">
                  <h2 className="mobile-section-title" style={{
                    color: '#2563eb',
                    fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                    fontWeight: '800',
                    marginBottom: '16px',
                  }}>
                    🏆 Enchères en Direct
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                  }}>
                    Découvrez et participez aux enchères en cours
                  </p>
                  <div style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    background: 'white',
                    padding: '20px',
                  }}>
                    <MobileLiveAuctions />
                  </div>
                </div>
              </section>

              {/* Mobile Live Tenders Section */}
              <section className="mobile-section" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)',
                position: 'relative',
                zIndex: 2,
              }}>
                <div className="container-mobile">
                  <h2 className="mobile-section-title">
                    📋 Soumissions en Direct
                  </h2>
                  <div style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    background: 'white',
                    padding: '16px',
                  }}>
                    <Home1LiveTenders />
                  </div>
                </div>
              </section>

              {/* Mobile Action Buttons Section */}
              <section className="mobile-section" style={{
                background: 'linear-gradient(135deg, #f1f3f4 0%, #ffffff 100%)',
                position: 'relative',
                zIndex: 2,
                paddingBottom: '60px',
              }}>
                <div className="container-mobile">
                  <h2 className="mobile-section-title">
                    🚀 Commencez Maintenant
                  </h2>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    alignItems: 'center',
                    maxWidth: '400px',
                    margin: '0 auto',
                  }}>
                    {/* Buy Button */}
                    <button
                      onClick={handleBuyButton}
                      className="mobile-btn mobile-btn-primary"
                      style={{
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
                      </svg>
                      Acheter / Enchérir
                    </button>

                    {/* Sell Button */}
                    <button
                      onClick={handleSellButton}
                      className="mobile-btn mobile-btn-secondary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      Vendre / Créer
                    </button>
                  </div>

                  {/* Mobile Additional Info */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '32px',
                    padding: '0 20px',
                  }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                    }}>
                      Rejoignez des milliers d'entreprises qui font confiance à MazadClick
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '24px',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.09 0 2.13.2 3.1.56"/>
                        </svg>
                        Sécurisé
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.6 1.53c.56-1.24.9-2.62.9-4.07 0-5.18-3.95-9.45-9-9.95z"/>
                        </svg>
                        24/7 Support
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2c0-1.1-.45-2.15-1.17-2.83C15.08 15.42 14.06 15 13 15H5c-1.06 0-2.08.42-2.83 1.17C1.45 16.85 1 17.9 1 19v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                        Communauté
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </AxiosInterceptor>
        </RequestProvider>
      </SnackbarProvider>
    </>
  );
}
