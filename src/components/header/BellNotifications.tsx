import { useState, useEffect, useRef } from 'react';
import { BiBell } from 'react-icons/bi';
import useNotifications from '@/hooks/useNotifications';

interface BellNotificationsProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

export default function BellNotifications({ variant = 'header', onOpenChange }: BellNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const { notifications, unreadCount, loading, refresh, markAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('BellNotifications: notifications count:', notifications.length);
  console.log('BellNotifications: unreadCount:', unreadCount);
  console.log('BellNotifications: loading:', loading);

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
    }
  };

  // Track window width for responsive positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle dropdown open/close events
  useEffect(() => {
    if (isOpen) {
      // Only notify parent component, don't refresh on every open
      // The notifications are already being managed by the hook
      if (onOpenChange) {
        onOpenChange(true);
      }
    }
  }, [isOpen, onOpenChange]); // Remove refresh dependency to prevent excessive API calls

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_WON':
        return '🏆';
      case 'CHAT_CREATED':
        return '💬';
      case 'BID_CREATED':
        return '🔨';
      case 'NEW_OFFER':
        return '💰';
      case 'BID_ENDED':
        return '⏰';
      default:
        return '📢';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? '#f1f1f1' : '#f8f9fa',
          border: 'none',
          borderRadius: '50%',
          width: variant === 'header' ? '40px' : '48px',
          height: variant === 'header' ? '40px' : '48px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.05)'
        }}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            e.currentTarget.style.background = '#f1f1f1';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            e.currentTarget.style.background = '#f8f9fa';
          }
        }}
      >
        <BiBell size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        {unreadCount > 0 && (
          <span style={{
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
            boxShadow: '0 0 0 2px #fff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          {windowWidth <= 768 && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                animation: 'fadeIn 0.2s ease-out'
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div style={{
            position: windowWidth <= 768 ? 'fixed' : 'absolute',
            top: windowWidth <= 768 ? '50%' : 'calc(100% + 10px)',
            left: windowWidth <= 768 ? '50%' : 'auto',
            right: windowWidth <= 768 ? 'auto' : 0,
            transform: windowWidth <= 768 ? 'translate(-50%, -50%)' : 'none',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            width: windowWidth <= 768 ? 'calc(100vw - 32px)' : '360px',
            maxWidth: windowWidth <= 768 ? '400px' : '360px',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, #fafafa, #ffffff)'
          }}>
            <div style={{ 
              fontWeight: 600, 
              color: '#333',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BiBell size={18} color="#0063b1" />
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  background: '#ff3366',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                // Mark all as read
                notifications.forEach(notification => {
                  if (!notification.read) {
                    markAsRead(notification._id);
                  }
                });
              }}
              style={{ 
                color: '#0063b1',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '15px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Tout marquer comme lu
            </button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#adb5bd'
              }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #0063b1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                <p style={{ fontSize: '14px', margin: '5px 0' }}>Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#adb5bd'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#f8f9fa',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px'
                }}>
                  <BiBell size={24} color="#d1d5db" />
                </div>
                <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: 500 }}>Aucune notification</p>
                <span style={{ fontSize: '13px', display: 'block', maxWidth: '200px', margin: '0 auto' }}>
                  Vos notifications apparaîtront ici
                </span>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => markAsRead(notification._id)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: notification.read ? 'white' : '#f0f8ff',
                    borderLeft: notification.read ? '3px solid transparent' : '3px solid #0063b1'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = notification.read ? '#fafafa' : '#e6f3ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : '#f0f8ff';
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: '20px',
                      lineHeight: 1,
                      marginTop: '2px'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notification.read ? 400 : 600,
                        color: '#333',
                        fontSize: '14px',
                        marginBottom: '4px',
                        lineHeight: 1.3
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: 1.4,
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{(notification as { formattedDate?: string }).formattedDate || new Date(notification.createdAt).toLocaleDateString()}</span>
                        {!notification.read && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#0063b1',
                            borderRadius: '50%'
                          }}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div style={{
              padding: '10px 15px',
              textAlign: 'center',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <span style={{
                color: '#666',
                fontSize: '13px'
              }}>
                Affichage de 10 sur {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 