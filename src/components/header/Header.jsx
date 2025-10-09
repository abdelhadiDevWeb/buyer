"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useReducer, useState, useEffect, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { authStore } from "@/contexts/authStore";
import { BiSearch } from 'react-icons/bi';
import ChatNotifications from '@/components/chat/ChatNotifications';
import NotificationBellStable from '@/components/NotificationBellStable';
import BellNotifications from '@/components/header/BellNotifications';
import { useChatNotificationsWithGeneral } from '@/hooks/useChatNotificationsWithGeneral';
import { useCreateSocket } from '@/contexts/socket';
import { BsChatDots } from 'react-icons/bs';
import ButtonSwitchApp from "../ButtonSwitchApp/ButtonSwitchApp";
import ReviewModal from '@/components/ReviewModal';
import { ReviewAPI } from '@/app/api/review';
import { NotificationAPI } from '@/app/api/notification';
import { useTranslation } from 'react-i18next';
import { getSellerUrl } from '@/config';
import app from '@/config';

const initialState = {
  activeMenu: "",
  activeSubMenu: "",
  isSidebarOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_MENU":
      return {
        ...state,
        activeMenu: state.activeMenu === action.menu ? "" : action.menu,
        activeSubMenu:
          state.activeMenu === action.menu ? state.activeSubMenu : "",
      };
    case "TOGGLE_SUB_MENU":
      return {
        ...state,
        activeSubMenu:
          state.activeSubMenu === action.subMenu ? "" : action.subMenu,
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case "setScrollY":
      return { ...state, scrollY: action.payload };
    default:
      return state;
  }
}

export const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const pathName = usePathname();
  const { isLogged, isReady, initializeAuth, auth } = useAuth();
  const [search, setSearch] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [switchAccount , setSwitchAccount] = useState(false)
  
  // Add windowWidth state
  const [windowWidth, setWindowWidth] = useState(1024);
  
  // Responsive state
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;
  const socketContext = useCreateSocket();
  const badgeRef = useRef(null);
  const [windowVal , setWindowVal] = useState('')
  const windowRef = useRef(null)

  // Get chat-related notifications (including CHAT_CREATED)
  const { totalUnread: chatTotalUnread } = useChatNotificationsWithGeneral();

  // Add a badge style for reuse
  const badgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#FF3366',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 5,
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 0 0 2px #fff',
    transition: 'transform 0.2s',
    transform: 'scale(1)',
  };

  const [bidWonNotifications, setBidWonNotifications] = useState([]);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentBidWonNotification, setCurrentBidWonNotification] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

  
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Set initial size
    setWindowWidth(window.innerWidth);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Add toggleMenu function
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Note: Unread count is now handled by useChatNotificationsWithGeneral hook


  useEffect(()=>{
    if(window.localStorage.getItem('switch')){
      if( window.localStorage.getItem('switch') == '1'){
        setSwitchAccount(true)
      }
     }
  },[])


  
  // Real-time update for new messages
  // (Removed badgeAnimate effect and related code for best practice)

  // Note: Chat notifications are handled by the ChatNotifications component directly

  const handleLogout = () => {
    authStore.getState().clear();
    window.location.href = `${getSellerUrl()}login`;
  };

  // Navigation Items
  const navItems = [
    { name: t('navigation.home'), path: "/" },
    { name: t('navigation.auctions'), path: "/auction-sidebar" },
    { name: t('navigation.tenders'), path: "/tenders" },
    { name: t('navigation.categories'), path: "/category" },
    { name: t('navigation.howToBid'), path: "/how-to-bid" },
    { name: t('navigation.members'), path: "/users" },
  ];


  async function swithAcc() {
    if(switchAccount){
      setSwitchAccount(false)
      console.log(windowRef);
      if (windowRef.current) {
        windowRef.current.close();
      }
      window.localStorage.removeItem('switch')
    }else{
      try {
        setSwitchAccount(true)
        window.localStorage.setItem('switch', "1")
        
        console.log('🔄 Switching to seller mode from buyer app...');
        
        // Call the mark-as-seller API (we need to create this endpoint)
        const response = await fetch(`${app.baseURL.replace(/\/$/, '')}/auth/mark-as-seller`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.tokens.accessToken}`,
            'x-access-key': app.apiKey,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        const data = await response.json();
        console.log('✅ Mark as seller response:', data);

        if (data.success && data.sellerUrl) {
          // Redirect to seller app with tokens
          const sellerAppUrl = new URL(data.sellerUrl);
          sellerAppUrl.searchParams.append('token', auth.tokens.accessToken);
          sellerAppUrl.searchParams.append('refreshToken', auth.tokens.refreshToken);
          sellerAppUrl.searchParams.append('from', 'buyer');
          
          console.log('🔄 Redirecting to seller app:', sellerAppUrl.toString());
          
          // Clear buyer session before redirecting
          authStore.getState().clear();
          
          // Redirect to seller app
          window.location.href = sellerAppUrl.toString();
        } else {
          throw new Error(data.message || 'Failed to mark user as seller');
        }
      } catch (error) {
        console.error('❌ Error switching to seller mode:', error);
        setSwitchAccount(false);
        window.localStorage.removeItem('switch');
        
        // Show error message to user
        alert('Failed to switch to seller mode. Please try again.');
      }
    }
  }
  useEffect(()=>{
    const vlInt = setInterval(()=>{
      if(windowRef.current && windowRef.current.closed){
         setSwitchAccount(false)
         window.localStorage.removeItem('switch')
      }
    },2000)
    return () => clearInterval(vlInt);
  },[])

  useEffect(() => {
    if (!socketContext?.socket) return;
    const handler = (notification) => {
      console.log('[Header] Received bid won notification:', notification);
      if (notification && notification.type === 'BID_WON') {
        setBidWonNotifications((prev) => {
          // Check for duplicates
          const exists = prev.some(n => n._id === notification._id);
          if (exists) return prev;
          return [notification, ...prev];
        });
        // Optionally, show a toast or alert here
        // e.g., toast.success(notification.title + ': ' + notification.message);
      }
    };
    socketContext.socket.on('bidWonNotification', handler);
    return () => {
      socketContext.socket.off('bidWonNotification', handler);
    };
  }, [socketContext?.socket]);



  // Check for BID_WON notifications on component mount and auth change
  useEffect(() => {
    const checkBidWonNotifications = async () => {
      if (!isLogged || !isReady) return;
      
      try {
        const response = await NotificationAPI.getAllNotifications();
        
        // Handle the new response structure: { notifications: [...] }
        const notifications = response.notifications || response || [];
        
        // Find unread BID_WON notifications
        const bidWonNotification = notifications.find(notif => 
          notif.type === 'BID_WON' && !notif.isRead
        );
        
        if (bidWonNotification) {
          setCurrentBidWonNotification(bidWonNotification);
          setIsReviewModalOpen(true);
        }
      } catch (error) {
        console.error('Error checking BID_WON notifications:', error);
      }
    };

    checkBidWonNotifications();
  }, [isLogged, isReady]);

  // Handle review submission
  const handleReviewSubmit = async (type, comment) => {
    if (!currentBidWonNotification) return;

    setIsSubmittingReview(true);
    
    try {
      // Get the seller/target user ID from the notification
      const targetUserId = currentBidWonNotification.senderId || currentBidWonNotification.targetUserId;
      
      if (!targetUserId) {
        throw new Error('Target user ID not found in notification');
      }

      // Submit the review
      if (type === 'like') {
        await ReviewAPI.likeUser(targetUserId, comment);
      } else {
        await ReviewAPI.dislikeUser(targetUserId, comment);
      }

      // Mark the notification as read
      await NotificationAPI.markAsRead(currentBidWonNotification._id);

      // Close modal and reset state
      setIsReviewModalOpen(false);
      setCurrentBidWonNotification(null);
      
      console.log(`Successfully submitted ${type} review for user ${targetUserId}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      // You can show an error toast here if you have a toast system
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle modal close
  const handleReviewModalClose = () => {
    setIsReviewModalOpen(false);
    setCurrentBidWonNotification(null);
  };

  return (
    <header 
      className="safe-top"
      style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
        padding: isMobile ? '8px 0' : (scrolled ? '12px 0' : '16px 0'),
        transition: 'all 0.3s ease'
      }}>
        <div className="container-responsive" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '60px' : isTablet ? '70px' : '80px',
          transition: 'height 0.3s ease'
        }}>
          {/* Logo */}
          <div style={{ 
            flexShrink: 0, 
            padding: 0, 
            margin: 5,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/assets/img/logo.png"
                  alt="Mazad.Click Logo"
                  className="header-logo"
                  style={{ 
                    height: isMobile ? '50px' : isTablet ? '65px' : '75px',
                    width: isMobile ? '120px' : isTablet ? '155px' : '180px',
                    transition: 'all 0.3s ease',
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    borderRadius: isMobile ? '12px' : '16px',
                    boxShadow: scrolled 
                      ? '0 2px 10px rgba(0, 99, 177, 0.2)' 
                      : '0 4px 15px rgba(0, 99, 177, 0.25)',
                    display: 'block',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          {isClient && windowWidth > 992 && (
            <nav style={{
              flex: 1,
              marginLeft: '40px'
            }}>
              <ul style={{
                display: 'flex',
                gap: '30px',
                listStyle: 'none',
                margin: 0,
                padding: 0
              }}>
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link 
                      href={item.path} 
                      style={{
                        color: pathName === item.path ? '#0063b1' : '#333',
                        fontWeight: pathName === item.path ? '600' : '500',
                        textDecoration: 'none',
                        fontSize: '16px',
                        position: 'relative',
                        padding: '8px 0',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {item.name}
                      {pathName === item.path && (
                        <span style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          width: '100%',
                          height: '2px',
                          background: '#0063b1',
                          borderRadius: '2px'
                        }}></span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Right section - Search, Language Switcher, Account, Menu Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Language Switcher moved to floating button at bottom-right */}
            
            {/* Search Input - Desktop and Tablet */}
            {isClient && !isMobile && (
              <div style={{
                position: 'relative',
                borderRadius: '30px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="text"
                  placeholder={t('common.search')}
                  style={{
                    border: 'none',
                    padding: isTablet ? '8px 16px' : '10px 20px',
                    paddingRight: '45px',
                    fontSize: isTablet ? '13px' : '14px',
                    width: isTablet ? '180px' : '220px',
                    background: '#f8f9fa',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                    e.currentTarget.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#666',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#0063b1';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16C11.866 16 15 12.866 15 9C15 5.13401 11.866 2 8 2C4.13401 2 1 5.13401 1 9C1 12.866 4.13401 16 8 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 17L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}

          

            {/* Notification Bell - Testing stable version */}
            {isClient && isReady && isLogged && (
              <div style={{ position: 'relative' }}>
                <NotificationBellStable key="notification-bell-header" variant="header" />
              </div>
            )}

            {/* Chat Icon - Messages Notifications */}
            {isClient && isReady && isLogged && (
              <div style={{ position: 'relative' }}>
                <ChatNotifications variant="header" />
              </div>
            )}

            {/* Account Section */}
            {isClient && isReady && (
              <div style={{ position: 'relative' }}>
                {isLogged ? (
                  <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: isAccountDropdownOpen ? '#0063b1' : 'linear-gradient(45deg, #0063b1, #0078d7)',
                      border: 'none',
                      borderRadius: '30px',
                      padding: isMobile ? '8px 12px' : isTablet ? '9px 16px' : '10px 20px',
                      color: 'white',
                      fontSize: isMobile ? '13px' : isTablet ? '14px' : '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isAccountDropdownOpen 
                        ? '0 4px 15px rgba(0, 99, 177, 0.5)' 
                        : '0 3px 10px rgba(0, 99, 177, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      if (!isAccountDropdownOpen) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 99, 177, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isAccountDropdownOpen) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 99, 177, 0.3)';
                      }
                    }}
                  >
                    <div style={{
                      width: isMobile ? '20px' : '24px',
                      height: isMobile ? '20px' : '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="white" />
                        <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="white" />
                      </svg>
                    </div>
                    {!isMobile ? t('common.myAccount') : ""}
                    <svg 
                      width={12} 
                      height={12} 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: isAccountDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                        opacity: 0.8
                      }}
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = `${getSellerUrl()}login`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'linear-gradient(45deg, #0063b1, #0078d7)',
                      border: 'none',
                      borderRadius: '30px',
                      padding: isMobile ? '8px 12px' : isTablet ? '9px 16px' : '10px 20px',
                      color: 'white',
                      fontSize: isMobile ? '13px' : isTablet ? '14px' : '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 3px 10px rgba(0, 99, 177, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 99, 177, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 99, 177, 0.3)';
                    }}
                  >
                    <div style={{
                      width: isMobile ? '20px' : '24px',
                      height: isMobile ? '20px' : '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="white" />
                        <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="white" />
                      </svg>
                    </div>
                    {!isMobile ? t('common.login') : ""}
                  </button>
                )}

                {/* Account Dropdown */}
                {isAccountDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 5px 25px rgba(0,0,0,0.12)',
                    minWidth: '280px',
                    zIndex: 10,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.25s ease-out'
                  }}>
                    {/* App Switcher Section */}
                    <div style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'linear-gradient(to right, #f7f9fc, #edf2f7)'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '5px',
                        textAlign: 'center'
                      }}>
                        {t('account.switchToSeller')}
                      </div>
                      <div
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          background: switchAccount ? 'rgba(0, 99, 177, 0.1)' : 'transparent',
                          padding: '8px 15px',
                          borderRadius: '30px',
                          transition: 'all 0.3s ease',
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <ButtonSwitchApp value={switchAccount} onChange={swithAcc}/>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        textAlign: 'center',
                        marginTop: '5px'
                      }}>
                        {switchAccount ? t('account.sellerModeActive') : t('account.currentlyInBuyerMode')}
                      </div>
                    </div>
                    
                    <Link href="/profile" onClick={() => {
                      console.log('🔗 Profile link clicked');
                      console.log('📍 Current pathname:', pathName);
                      setIsAccountDropdownOpen(false);
                    }}>
                      <div style={{
                        padding: '14px 20px',
                        color: '#333',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        borderLeft: pathName === '/profile' ? '3px solid #0063b1' : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                        e.currentTarget.style.borderLeftColor = '#0063b1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        if (pathName !== '/profile') {
                          e.currentTarget.style.borderLeftColor = 'transparent';
                        }
                      }}
                      >
                        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#0063b1"/>
                          <path d="M8 10C3.58172 10 0 12.6863 0 16H16C16 12.6863 12.4183 10 8 10Z" fill="#0063b1"/>
                        </svg>
                        {t('account.myProfile')}
                      </div>
                    </Link>
                    
                    <Link href="/users" onClick={() => setIsAccountDropdownOpen(false)}>
                      <div style={{
                        padding: '14px 20px',
                        color: '#333',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        borderLeft: pathName === '/users' ? '3px solid #0063b1' : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                        e.currentTarget.style.borderLeftColor = '#0063b1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        if (pathName !== '/users') {
                          e.currentTarget.style.borderLeftColor = 'transparent';
                        }
                      }}
                      >
                        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14V12.6667C12 11.9594 11.7366 11.2811 11.2678 10.781C10.7989 10.281 10.1667 10 9.5 10H3.5C2.83333 10 2.20139 10.281 1.73223 10.781C1.26339 11.2811 1 11.9594 1 12.6667V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.5 7C7.88071 7 9 5.88071 9 4.5C9 3.11929 7.88071 2 6.5 2C5.11929 2 4 3.11929 4 4.5C4 5.88071 5.11929 7 6.5 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 14V12.6667C14.9994 12.0758 14.8044 11.5018 14.4462 11.0357C14.0879 10.5696 13.5866 10.2357 13.03 10.0867" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.53 2.08667C11.0879 2.23464 11.5904 2.56882 11.9493 3.03577C12.3081 3.50272 12.5032 4.07789 12.5032 4.67C12.5032 5.26211 12.3081 5.83728 11.9493 6.30423C11.5904 6.77118 11.0879 7.10536 10.53 7.25333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {t('account.users')}
                      </div>
                    </Link>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 20px',
                        background: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        borderLeft: '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff5f5';
                        e.currentTarget.style.borderLeftColor = '#dc3545';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderLeftColor = 'transparent';
                      }}
                    >
                      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('account.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {isClient && windowWidth <= 992 && (
              <button
                className="mobile-menu-toggle"
                onClick={toggleMenu}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  zIndex: 1010
                }}
              >
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}></span>
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  opacity: isMenuOpen ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }}></span>
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isClient && isMenuOpen && windowWidth <= 992 && (
        <div 
          className="safe-top safe-bottom mobile-scroll"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'white',
            zIndex: 1000,
            overflowY: 'auto',
            paddingTop: isMobile ? '70px' : '90px',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div className="container-responsive" style={{ 
            padding: isMobile ? '16px' : '20px',
            minHeight: 'calc(100vh - 70px)'
          }}>
            {/* Mobile Search */}
            <div style={{
              position: 'relative',
              borderRadius: '30px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              marginBottom: '24px'
            }}>
              <input
                type="text"
                placeholder={t('common.search')}
                className="form-responsive"
                style={{
                  border: 'none',
                  padding: isMobile ? '12px 16px' : '12px 20px',
                  paddingRight: '45px',
                  fontSize: '16px', // Prevents zoom on iOS
                  width: '100%',
                  background: '#f8f9fa',
                  outline: 'none',
                  borderRadius: '30px'
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16C11.866 16 15 12.866 15 9C15 5.13401 11.866 2 8 2C4.13401 2 1 5.13401 1 9C1 12.866 4.13401 16 8 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 17L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {navItems.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <Link
                      href={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: isMobile ? '16px 20px' : '15px',
                        background: pathName === item.path ? '#f8f9fa' : 'transparent',
                        borderRadius: '12px',
                        color: pathName === item.path ? '#0063b1' : '#333',
                        fontWeight: pathName === item.path ? '600' : '500',
                        fontSize: isMobile ? '16px' : '16px',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        borderLeft: pathName === item.path ? '4px solid #0063b1' : '4px solid transparent',
                        minHeight: '44px' // Better touch target
                      }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <style jsx global>{`
        .header-logo {
          max-height: 75px;
          max-width: 180px;
        }
        @media (max-width: 992px) {
          .header-logo {
            max-height: 65px;
            max-width: 155px;
          }
          .header-container {
            padding: 0 8px;
          }
        }
        @media (max-width: 768px) {
          .header-logo {
            max-height: 50px;
            max-width: 120px;
          }
          .header-container {
            padding: 0 4px;
          }
          .mobile-menu-toggle {
            width: 36px !important;
            height: 36px !important;
          }
        }
        @media (max-width: 576px) {
          .header-logo {
            max-height: 50px;
            max-width: 120px;
          }
          .header-container {
            padding: 0 2px;
          }
          .mobile-menu-toggle {
            width: 32px !important;
            height: 32px !important;
          }
          .header-container ul li a {
            font-size: 14px !important;
          }
        }
        .header-container ul li a {
          font-size: 16px;
        }
      `}</style>

      {/* Review Modal for BID_WON notifications */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleReviewModalClose}
        onSubmitReview={handleReviewSubmit}
        targetUserId={currentBidWonNotification?.senderId || currentBidWonNotification?.targetUserId || ''}
        auctionTitle={currentBidWonNotification?.message || currentBidWonNotification?.title}
        isLoading={isSubmittingReview}
      />
    </header>
  );
};

export default Header;