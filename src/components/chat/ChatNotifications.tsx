import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BiMessage } from 'react-icons/bi';
import { useChatNotificationsWithGeneral } from '@/hooks/useChatNotificationsWithGeneral';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/utils/api';
import useAuth from '@/hooks/useAuth';

interface ChatNotificationsProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

export default function ChatNotifications({ variant = 'header', onOpenChange }: ChatNotificationsProps) {
  const t = (key: string, _opts?: any) => {
    const translations = {
      'chat.justNow': 'À l\'instant',
      'chat.minutesAgo': `Il y a ${_opts?.minutes || 0} minutes`,
      'chat.hoursAgo': `Il y a ${_opts?.hours || 0} heures`,
      'chat.daysAgo': `Il y a ${_opts?.days || 0} jours`,
      'chat.messages': 'Messages',
      'chat.markAllAsRead': 'Marquer tout comme lu',
      'chat.loading': 'Chargement...',
      'chat.noMessages': 'Aucun message',
      'chat.messagesWillAppear': 'Vos messages apparaîtront ici',
      'chat.newConversations': 'Nouvelles conversations',
      'chat.unknown': 'Inconnu',
      'chat.newConversationStarted': 'Nouvelle conversation démarrée',
      'chat.recentMessages': 'Messages récents',
      'chat.newMessage': 'Nouveau message',
      'chat.viewAllMessages': 'Voir tous les messages'
    };
    return translations[key] || key;
  };
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use Zustand store pattern for auth
  const { auth } = useAuth();
  
  const { 
    chatCreatedNotifications, 
    chatNotifications, // This is the chat messages, not chatMessages
    loading, 
    refresh, 
    totalUnread 
  } = useChatNotificationsWithGeneral();

  console.log('💬 ChatNotifications: chatCreatedNotifications count:', chatCreatedNotifications.length);
  console.log('💬 ChatNotifications: chatNotifications count:', chatNotifications.length);
  console.log('💬 ChatNotifications: totalUnread:', totalUnread);
  console.log('💬 ChatNotifications: loading:', loading);
  
  // Debug unread notifications specifically
  const unreadChatCreated = chatCreatedNotifications.filter(n => n.read === false);
  const unreadChatMessages = chatNotifications.filter(n => n.unread > 0);
  
  console.log('💬 Unread chat notifications breakdown:', {
    unreadChatCreated: unreadChatCreated.length,
    unreadChatMessages: unreadChatMessages.length,
    totalUnread: totalUnread
  });

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
    }
  };

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

  // Refresh notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      refresh();
      if (onOpenChange) {
        onOpenChange(true);
      }
    }
  }, [isOpen, refresh, onOpenChange]);

  // Handle marking individual notification as read
  const handleNotificationClick = async (notification: any) => {
    try {
      console.log('🔖 Marking chat notification as read:', notification);
      
      if (notification._id && auth?.tokens?.accessToken) {
        await markNotificationAsRead(notification._id);
        console.log('✅ Chat notification marked as read');
        
        // Refresh notifications to update the count and UI
        await refresh();
        console.log('🔄 Chat notifications refreshed after marking as read');
      }
      
      // Navigate to chat (you can customize the navigation logic)
      if (notification.data?.chatId) {
        window.location.href = `/chat/${notification.data.chatId}`;
      } else {
        window.location.href = '/chat';
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('❌ Error marking chat notification as read:', error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      console.log('🔖 Marking all chat notifications as read');
      
      if (auth?.tokens?.accessToken) {
        await markAllNotificationsAsRead();
        console.log('✅ All chat notifications marked as read');
        
        // Refresh notifications to update the count and UI
        await refresh();
        console.log('🔄 Chat notifications refreshed after marking all as read');
      }
    } catch (error) {
      console.error('❌ Error marking all chat notifications as read:', error);
    }
  };

  // Helper function to format time
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('chat.justNow');
    if (diffInMinutes < 60) return t('chat.minutesAgo', { minutes: diffInMinutes });
    if (diffInMinutes < 1440) return t('chat.hoursAgo', { hours: Math.floor(diffInMinutes / 60) });
    return t('chat.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
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
        title={t('chat.messages')}
      >
        <BiMessage size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        
        {totalUnread > 0 && (
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
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          width: '360px',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          
          {/* Header */}
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
              <BiMessage size={18} color="#0063b1" />
              {t('chat.messages')}
              {totalUnread > 0 && (
                <span style={{
                  background: '#ff3366',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {totalUnread}
                </span>
              )}
            </div>
            
            {totalUnread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0063b1',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f0f8ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {t('chat.markAllAsRead')}
              </button>
            )}
          </div>

          {/* Content */}
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
                <p style={{ fontSize: '14px', margin: '5px 0' }}>{t('chat.loading')}</p>
              </div>
            ) : [
                ...(chatCreatedNotifications || []), 
                ...(chatNotifications || [])
              ].length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#adb5bd'
              }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px',
                  borderRadius: '50%',
                  background: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px'
                }}>
                  <BiMessage size={24} color="#d1d5db" />
                </div>
                <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: 500 }}>
                  {t('chat.noMessages')}
                </p>
                <span style={{ fontSize: '13px', display: 'block', maxWidth: '200px', margin: '0 auto' }}>
                  {t('chat.messagesWillAppear')}
                </span>
              </div>
            ) : (
              <div>
                {/* Chat Created Notifications */}
                {chatCreatedNotifications && chatCreatedNotifications.length > 0 && (
                  <>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      {t('chat.newConversations')}
                    </div>
                    
                    {chatCreatedNotifications.map((notification: any) => {
                      const userName = notification.data?.senderName || t('chat.unknown');
                      
                      return (
                        <div 
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            padding: '12px 15px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Sender Avatar */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#e6f0fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0063b1',
                            fontWeight: 600,
                            fontSize: '18px',
                            flexShrink: 0
                          }}>
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: '4px'
                            }}>
                              <span style={{
                                fontWeight: 600,
                                color: '#333',
                                fontSize: '14px'
                              }}>
                                {userName}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: '#999'
                              }}>
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            
                            <p style={{
                              margin: '0',
                              fontSize: '13px',
                              color: '#666',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {t('chat.newConversationStarted')}
                            </p>
                            
                            {/* Sender Information */}
                            {(notification.senderName || notification.data?.senderName || notification.data?.winnerName || notification.data?.buyerName) && (
                              <div style={{
                                fontSize: '11px',
                                color: '#0063b1',
                                fontWeight: 500,
                                marginTop: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>👤</span>
                                <span>
                                  {notification.senderName || 
                                   notification.data?.senderName || 
                                   notification.data?.winnerName || 
                                   notification.data?.buyerName || 
                                   'Unknown User'}
                                </span>
                                {notification.senderEmail && (
                                  <span style={{ fontSize: '9px', color: '#999' }}>
                                    ({notification.senderEmail})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {!notification.read && (
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#0063b1'
                            }}></div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              
                {/* Chat Messages */}
                {chatNotifications && chatNotifications.length > 0 && (
                  <>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      {t('chat.recentMessages')}
                    </div>
                    
                    {chatNotifications.map((notification: any) => {
                      const userName = notification.data?.senderName || t('chat.unknown');
                      const message = notification.data?.message || t('chat.newMessage');
                      
                      return (
                        <div 
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            padding: '12px 15px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Sender Avatar */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#e6f0fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0063b1',
                            fontWeight: 600,
                            fontSize: '18px',
                            flexShrink: 0
                          }}>
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: '4px'
                            }}>
                              <span style={{
                                fontWeight: 600,
                                color: '#333',
                                fontSize: '14px'
                              }}>
                                {userName}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: '#999'
                              }}>
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            
                            <p style={{
                              margin: '0',
                              fontSize: '13px',
                              color: '#666',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {message}
                            </p>
                          </div>
                          
                          {!notification.read && (
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#0063b1'
                            }}></div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div style={{
            padding: '12px 15px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
            background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
          }}>
            <Link 
              href="/chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0063b1',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'rgba(0, 99, 177, 0.1)',
                border: '1px solid rgba(0, 99, 177, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 99, 177, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <BiMessage size={16} />
              {t('chat.viewAllMessages')}
            </Link>
          </div>
        </div>
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