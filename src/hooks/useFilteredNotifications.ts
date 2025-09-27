import { useState, useEffect, useCallback } from 'react';

export enum NotificationType {
  BID_CREATED = 'BID_CREATED',
  NEW_OFFER = 'NEW_OFFER',
  BID_ENDED = 'BID_ENDED',
  BID_WON = 'BID_WON',
  CHAT_CREATED = 'CHAT_CREATED',
}

interface DatabaseNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FilteredNotifications {
  chatNotifications: DatabaseNotification[];
  bellNotifications: DatabaseNotification[];
  chatUnreadCount: number;
  bellUnreadCount: number;
}

export function useFilteredNotifications() {
  const [allNotifications, setAllNotifications] = useState<DatabaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[FILTERED-NOTIFICATIONS] Fetching notifications from database');
      
      // Get authentication data
      const auth = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
      if (!auth) {
        console.log('[FILTERED-NOTIFICATIONS] No authentication found');
        setAllNotifications([]);
        setLoading(false);
        return;
      }
      
      const { user, tokens } = JSON.parse(auth);
      const userId = user._id;
      const token = tokens.accessToken;
      
      console.log('[FILTERED-NOTIFICATIONS] Fetching for user:', userId);
      
      // Call the existing API endpoint
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FILTERED-NOTIFICATIONS] API error:', errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[FILTERED-NOTIFICATIONS] ✅ Retrieved notifications:', data.notifications?.length || 0);
      
      setAllNotifications(data.notifications || []);
      setLoading(false);
      
    } catch (err) {
      console.error('[FILTERED-NOTIFICATIONS] Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  // Filter notifications by type
  const getFilteredNotifications = useCallback((): FilteredNotifications => {
    // Chat/Message notifications: CHAT_CREATED
    const chatNotifications = allNotifications.filter(notification => 
      notification.type === NotificationType.CHAT_CREATED
    );

    // Bell notifications: BID_WON, BID_ENDED, NEW_OFFER, BID_CREATED
    const bellNotifications = allNotifications.filter(notification => 
      notification.type === NotificationType.BID_WON ||
      notification.type === NotificationType.BID_ENDED ||
      notification.type === NotificationType.NEW_OFFER ||
      notification.type === NotificationType.BID_CREATED
    );

    // Count unread notifications for each type
    const chatUnreadCount = chatNotifications.filter(n => !n.read).length;
    const bellUnreadCount = bellNotifications.filter(n => !n.read).length;

    console.log('[FILTERED-NOTIFICATIONS] Filtered results:', {
      total: allNotifications.length,
      chat: chatNotifications.length,
      bell: bellNotifications.length,
      chatUnread: chatUnreadCount,
      bellUnread: bellUnreadCount
    });

    return {
      chatNotifications,
      bellNotifications,
      chatUnreadCount,
      bellUnreadCount
    };
  }, [allNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('[FILTERED-NOTIFICATIONS] Marking notification as read:', notificationId);
      
      // Update local state immediately
      setAllNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Get auth token
      const auth = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
      if (!auth) return;
      
      const { tokens } = JSON.parse(auth);
      const token = tokens.accessToken;
      
      // Update on backend using existing API
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      console.log('[FILTERED-NOTIFICATIONS] ✅ Notification marked as read on server');
      
    } catch (error) {
      console.error('[FILTERED-NOTIFICATIONS] Error marking notification as read:', error);
      // Revert local state on error
      setAllNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: false } 
            : notification
        )
      );
    }
  }, []);

  // Get filtered data
  const filteredData = getFilteredNotifications();

  // Auto-fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    // Raw data
    allNotifications,
    loading,
    error,
    
    // Filtered data
    chatNotifications: filteredData.chatNotifications,
    bellNotifications: filteredData.bellNotifications,
    chatUnreadCount: filteredData.chatUnreadCount,
    bellUnreadCount: filteredData.bellUnreadCount,
    
    // Actions
    fetchNotifications,
    markAsRead,
    refresh: fetchNotifications
  };
}

export default useFilteredNotifications; 