import { useState, useEffect, useRef, memo } from 'react';
import { BsBell, BsHammer, BsTrophy, BsExclamationCircle, BsChat } from 'react-icons/bs';
import useTotalNotifications from '@/hooks/useTotalNotifications';
import useNotification from '@/hooks/useNotification';
import { useAdminMessageNotifications } from '@/hooks/useAdminMessageNotifications';
import type { Notification } from '@/types';

interface NotificationBellStableProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

const NotificationBellStable = memo(function NotificationBellStable({ variant = 'header', onOpenChange }: NotificationBellStableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = (key: string, _opts?: any) => {
    const translations = {
      'notifications.title': 'Notifications',
      'notifications.markAllAsRead': 'Marquer tout comme lu',
      'notifications.loading': 'Chargement des notifications...',
      'notifications.noNotifications': 'Aucune notification',
      'notifications.noNotificationsDesc': 'Vos notifications apparaîtront ici',
      'notifications.showingCount': `Affichage de 10 sur ${_opts?.total || 0} notifications`
    };
    return translations[key] || key;
  };
  
  // Get notification data
  const { totalUnreadCount, refreshAll } = useTotalNotifications();
  const { notifications: generalNotifications, markAsRead: markGeneralAsRead, markAllAsRead: markAllGeneralAsRead, loading: generalLoading } = useNotification();
  const { adminNotifications, markAsRead: markAdminAsRead, loading: adminLoading } = useAdminMessageNotifications();

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
      // Refresh notifications when dropdown opens
      refreshAll();
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

  // Combine all notifications
  const allNotifications = [
    ...generalNotifications.map((n): Notification & { source: 'general' } => ({ ...(n as Notification), source: 'general' })),
    ...adminNotifications.map((n): Notification & { source: 'admin' } => ({ ...(n as Notification), source: 'admin' }))
  ].sort((a, b) => new Date(a.createdAt).getTime() < new Date(b.createdAt).getTime() ? 1 : -1);

  // Debug logging
  useEffect(() => {
    console.log('🔔 NotificationBellStable - Notification counts:', {
      generalNotifications: generalNotifications.length,
      adminNotifications: adminNotifications.length,
      totalUnreadCount,
      allNotifications: allNotifications.length
    });
    
    // Check for unread notifications specifically
    const unreadGeneral = generalNotifications.filter(n => n.read === false);
    const unreadAdmin = adminNotifications.filter(n => n.read === false);
    
    console.log('🔔 Unread notifications breakdown:', {
      unreadGeneral: unreadGeneral.length,
      unreadAdmin: unreadAdmin.length,
      totalUnread: unreadGeneral.length + unreadAdmin.length
    });
    
    if (generalNotifications.length > 0) {
      console.log('🔔 General notifications details:', generalNotifications.map(n => ({
        id: n._id,
        title: n.title,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt
      })));
    }
    
    if (adminNotifications.length > 0) {
      console.log('🔔 Admin notifications details:', adminNotifications.map(n => ({
        id: n._id,
        title: n.title,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt
      })));
    }
    
    if (allNotifications.length > 0) {
      console.log('🔔 All notifications sample:', allNotifications.slice(0, 3));
    } else {
      console.log('🔔 No notifications found - checking loading states:', {
        generalLoading,
        adminLoading,
        generalNotifications,
        adminNotifications
      });
    }
  }, [generalNotifications.length, adminNotifications.length, totalUnreadCount, allNotifications.length, generalLoading, adminLoading]);

  const handleMarkAsRead = async (notification: any) => {
    try {
      console.log('🔖 Marking notification as read:', notification._id, 'source:', notification.source);
      
      if (notification.source === 'general') {
        await markGeneralAsRead(notification._id);
        console.log('✅ General notification marked as read');
      } else if (notification.source === 'admin') {
        await markAdminAsRead(notification._id);
        console.log('✅ Admin notification marked as read');
      }
      
      // Refresh all notifications to get updated data
      await refreshAll();
      console.log('🔄 Notifications refreshed after marking as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('🔖 Marking all notifications as read');
      await markAllGeneralAsRead();
      // Note: Admin notifications might need separate mark all as read function
      
      // Refresh all notifications to get updated data
      await refreshAll();
      console.log('🔄 Notifications refreshed after marking all as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_CREATED':
        return <BsHammer size={16} color="#0063b1" />;
      case 'BID_ENDED':
        return <BsExclamationCircle size={16} color="#ffc107" />;
      case 'BID_WON':
        return <BsTrophy size={16} color="#ffd700" />;
      case 'MESSAGE_ADMIN':
      case 'MESSAGE_RECEIVED':
        return <BsChat size={16} color="#28a745" />;
      default:
        return <BsBell size={16} color="#666" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
        title="Notifications"
      >
        <BsBell size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        {/* Show badge only when there are actual unread notifications */}
        {totalUnreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ff3366',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 0 0 2px #fff'
          }}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
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
              <BsBell size={18} color="#0063b1" />
              {t('notifications.title') || 'Notifications'}
              {totalUnreadCount > 0 && (
                <span style={{
                  background: '#ff3366',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {totalUnreadCount}
                </span>
              )}
            </div>
            {totalUnreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
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
                {t('notifications.markAllAsRead') || 'Mark all as read'}
              </button>
            )}
          </div>
          
          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {(generalLoading || adminLoading) ? (
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
                <p style={{ fontSize: '14px', margin: '5px 0' }}>
                  {t('notifications.loading') || 'Loading notifications...'}
                </p>
              </div>
            ) : allNotifications.length === 0 ? (
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
                  <BsBell size={24} color="#d1d5db" />
                </div>
                <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: 500 }}>
                  {t('notifications.noNotifications') || 'No notifications'}
                </p>
                <span style={{ fontSize: '13px', display: 'block', maxWidth: '200px', margin: '0 auto' }}>
                  {t('notifications.noNotificationsDesc') || 'Your notifications will appear here'}
                </span>
              </div>
            ) : (
              allNotifications.slice(0, 10).map((notification: Notification & { source: 'general' | 'admin' }) => (
                <div
                  key={notification._id}
                  onClick={() => handleMarkAsRead(notification)}
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
                        lineHeight: '1.3'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </div>
                      {/* Sender Information */}
                      {(((notification as any)?.senderName) || notification.data?.senderName || notification.data?.winnerName || notification.data?.buyerName) && (
                        <div style={{
                          fontSize: '12px',
                          color: '#0063b1',
                          fontWeight: 500,
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>👤</span>
                          <span>
                            {(notification as any)?.senderName || 
                             notification.data?.senderName || 
                             notification.data?.winnerName || 
                             notification.data?.buyerName || 
                             'Unknown User'}
                          </span>
                          {(notification as any)?.senderEmail && (
                            <span style={{ fontSize: '10px', color: '#999' }}>
                              ({(notification as any)?.senderEmail})
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatTime(notification.createdAt)}</span>
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

          {allNotifications.length > 10 && (
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
                {t('notifications.showingCount', { shown: 10, total: allNotifications.length }) || 
                 `Showing 10 of ${allNotifications.length} notifications`}
              </span>
            </div>
          )}
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
});

export default NotificationBellStable;
