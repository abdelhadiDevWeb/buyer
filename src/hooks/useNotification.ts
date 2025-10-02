import { useState, useCallback, useEffect } from 'react';
import { authStore } from '@/contexts/authStore';
import { useCreateSocket } from '@/contexts/socket';
import { getUnreadNotificationCount } from '@/utils/api';

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  receiver?: string;
  reciver?: string;
}

export default function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Call useCreateSocket at the top level
  const socketContext = useCreateSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      // Check if user is authenticated before making API call
      const { auth, isLogged } = authStore.getState();
      console.log('🔍 Auth state check:', { 
        isLogged, 
        hasUser: !!auth?.user, 
        hasTokens: !!auth?.tokens, 
        hasAccessToken: !!auth?.tokens?.accessToken,
        userId: auth?.user?._id,
        tokenLength: auth?.tokens?.accessToken?.length
      });
      
      if (!isLogged || !auth?.tokens?.accessToken) {
        console.log('⚠️ User not authenticated, skipping notifications fetch');
        console.log('💡 Please log in to see notifications');
        setNotifications([]); // Reset notifications
        setUnreadCount(0); // Reset unread count
        return;
      }
      
      console.log('✅ User is authenticated, proceeding with notifications fetch');
      
      setLoading(true);
      console.log('📥 Fetching notifications for user:', auth.user?._id);
      
      try {
        const response = await fetch('/api/notifications/general', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.tokens.accessToken}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Authentication failed (401) - token may be expired or invalid');
            console.error('🔍 Token details:', {
              hasToken: !!auth.tokens.accessToken,
              tokenLength: auth.tokens.accessToken.length,
              tokenStart: auth.tokens.accessToken.substring(0, 20) + '...'
            });
            // Try to refresh auth state
            authStore.getState().refreshAuthState();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const allNotifications = data.notifications || [];
        
        console.log('📥 General notifications from API:', allNotifications.length);
        console.log('📥 Full API response:', data);
        console.log('📥 Sample notification:', allNotifications[0]);
        console.log('📥 All general notifications details:', allNotifications.map((n: any) => ({
          id: n._id,
          title: n.title,
          type: n.type,
          read: n.read,
          userId: n.userId,
          senderId: n.senderId,
          senderName: n.senderName,
          senderEmail: n.senderEmail,
          createdAt: n.createdAt
        })));
        
        // Check specifically for offer notifications
        const offerNotifications = allNotifications.filter((n: any) => 
          n.type === 'OFFER_ACCEPTED' || n.type === 'OFFER_DECLINED'
        );
        console.log('🎯 Offer notifications found:', offerNotifications.length);
        if (offerNotifications.length > 0) {
          console.log('🎯 Offer notifications details:', offerNotifications);
        } else {
          console.log('❌ No offer notifications found in general notifications');
          console.log('🔍 Available notification types:', allNotifications.map((n: any) => n.type));
        }
        
        // No need to filter - API already returns only unread general notifications
        setNotifications(allNotifications);
        
        // Update unread count based on the filtered notifications
        const unreadCount = allNotifications.filter((n: any) => n.read === false).length;
        setUnreadCount(unreadCount);
        console.log('📊 Calculated unread count from notifications:', unreadCount);
        
        setError(null); // Clear any previous errors
      } catch (fetchErr) {
        console.error('❌ Error fetching notifications:', fetchErr);
        setError('Failed to fetch notifications');
        setNotifications([]); // Reset on error
      }
    } catch (err) {
      setError('Unexpected error in notifications hook');
      console.error('❌ Unexpected error in fetchNotifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count with enhanced error handling
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Check if user is authenticated before making API call
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        console.log('⚠️ User not authenticated, skipping unread count fetch');
        console.log('💡 Please log in to see notification count');
        setUnreadCount(0); // Reset unread count
        return;
      }
      
      try {
      const count = await getUnreadNotificationCount();
        
        // Handle different response structures
        const countData = count?.data ? count.data : (typeof count === 'number' ? count : 0);
        
        // Validate count
        if (typeof countData !== 'number') {
          console.warn('⚠️ Invalid unread count format:', countData);
          // If count is not a number, default to 0
          setUnreadCount(0);
          return;
        }
        
        console.log('📥 Unread notifications count:', countData);
      setUnreadCount(countData);
      } catch (countErr: any) {
        console.error('❌ Error fetching unread count:', countErr);
        // Default to 0 on error
        setUnreadCount(0);
        
        // Log detailed error if available
        if ((countErr as any)?.response) {
          console.error('ℹ️ Response status:', (countErr as any).response.status);
          console.error('ℹ️ Response data:', (countErr as any).response.data);
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error in fetchUnreadCount:', err);
      setUnreadCount(0); // Default to 0 on unexpected error
    }
  }, []);

  // Mark a notification as read with optimistic update and enhanced error handling
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        console.warn('⚠️ User not authenticated, cannot mark notification as read');
        return;
      }

      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );

      // Update unread count optimistically
      setUnreadCount(prev => Math.max(0, prev - 1));

      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.tokens.accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ Notification marked as read successfully');
        
        // Refresh notifications to get the latest data from server
        await fetchNotifications();
        await fetchUnreadCount();
        console.log('🔄 Notifications refreshed after marking as read');
      } catch (markErr) {
        console.error('❌ Error marking notification as read:', markErr);
        
        // Revert optimistic update on error
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: false } 
              : notification
          )
        );
        setUnreadCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ Unexpected error in markAsRead:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { auth, isLogged } = authStore.getState();
      if (!isLogged || !auth?.tokens?.accessToken) {
        console.warn('⚠️ User not authenticated, cannot mark all notifications as read');
        return;
      }

      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);

      try {
        const response = await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.tokens.accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ All notifications marked as read successfully');
        
        // Refresh notifications to get the latest data from server
        await fetchNotifications();
        await fetchUnreadCount();
        console.log('🔄 Notifications refreshed after marking all as read');
      } catch (markErr) {
        console.error('❌ Error marking all notifications as read:', markErr);
        
        // Revert optimistic update on error
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('❌ Unexpected error in markAllAsRead:', err);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Listen for real-time notifications from socket
  useEffect(() => {
    if (!socketContext?.socket) {
      console.log('⚠️ Socket not available for notifications');
      return;
    }

    console.log('🔌 Setting up notification socket listeners');

    const handleNewNotification = (notification: Notification) => {
      console.log('📨 New socket notification received for general notifications:', notification);
      
      // Only process general notifications (non-chat, non-admin)
      const isChatNotification = 
        notification.type === 'CHAT_CREATED' || 
        notification.type === 'MESSAGE_RECEIVED' ||
        notification.type === 'MESSAGE_ADMIN';
      
      const isAdminMessageTitle = notification.title === 'Nouveau message de l\'admin';
      const isAdminMessageType = notification.type === 'MESSAGE_ADMIN';
      const isAdminSender = 
        notification.data?.senderId === 'admin' ||
        (notification.data?.sender as any)?._id === 'admin';
      
      // Only process general notifications for bell icon
      if (isChatNotification || isAdminMessageTitle || isAdminMessageType || isAdminSender) {
        console.log('ℹ️ Notification excluded from general notifications:', {
          title: notification.title,
          type: notification.type,
          reason: isChatNotification ? 'chat notification' : 'admin message'
        });
        return;
      }
      
      // Handle both reciver/receiver property names for consistency
      if (notification.receiver && !notification.reciver) {
        notification.reciver = notification.receiver;
      } else if (notification.reciver && !notification.receiver) {
        notification.receiver = notification.reciver;
      }

      console.log('✅ Adding socket notification to state:', notification);
      // Add notification to state and increment unread count
      setNotifications(prev => {
        // Check if notification already exists to prevent duplicates
        const exists = prev.some(n => n._id === notification._id);
        if (exists) {
          console.log('⚠️ Notification already exists in state, skipping duplicate');
          return prev;
        }
        return [notification, ...prev];
      });
      
      // Increment unread count
      if (!notification.read) {
        console.log('📈 Incrementing unread count for socket notification:', notification._id);
        setUnreadCount(prev => prev + 1);
      }
    };

    try {
      // First remove any existing listeners to prevent duplicates
      socketContext.socket.off('notification');
      
      // Add new listener
      socketContext.socket.on('notification', handleNewNotification);
      console.log('✅ Notification socket listeners registered');

      // Clean up function
      return () => {
        console.log('🧹 Cleaning up notification socket listeners');
        if (socketContext.socket) {
          socketContext.socket.off('notification', handleNewNotification);
        }
      };
    } catch (error) {
      console.warn('⚠️ Socket notification listener error:', error);
    }
  }, [socketContext?.socket]);  // Add socketContext.socket as dependency

  return {
    notifications, // Return all notifications (filtering already done in fetch)
    unreadCount, // Return unread count from state
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount
  };
} 