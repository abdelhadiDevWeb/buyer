import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

interface AdminMessage {
  _id: string;
  sender: string;
  receiver?: string;
  reciver?: string; // Keep both properties for backward compatibility
  message: string;
  isUnRead: boolean;
  createdAt: string;
}

// Cache for processed messages to avoid duplicates
const adminMessageNotificationCache = {
  processedMessages: new Set<string>(),
  lastProcessedTime: 0
};

export function useAdminMessageNotifications() {
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [socketMessages, setSocketMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketContext = useCreateSocket();
  const auth = authStore((state) => state.auth);
  const isReady = authStore((state) => state.isReady);

  // Get current user from auth store
  const getCurrentUserId = useCallback(() => {
    return auth?.user?._id;
  }, [auth?.user?._id]);

  const currentUserId = getCurrentUserId();

  // Fetch admin message notifications
  const fetchAdminNotifications = useCallback(async () => {
    try {
      // Get current auth state to avoid dependency issues
      const currentAuth = authStore.getState().auth;
      const currentIsReady = authStore.getState().isReady;
      
      // Wait for auth to be ready
      if (!currentIsReady) {
        console.log('Auth not ready yet, skipping admin notifications fetch');
        return;
      }

      // Check if user is authenticated
      if (!currentAuth?.user?._id || !currentAuth?.tokens?.accessToken) {
        console.log('User not authenticated, setting empty admin notifications');
        setAdminNotifications([]);
        return;
      }

      const userId = currentAuth.user._id;
      const token = currentAuth.tokens.accessToken;
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      
      if (response.ok) {
        const data = await response.json();
        const allNotifications = data.notifications || [];
        
        // Filter for admin message notifications only
        const adminMessageNotifications = allNotifications.filter((notification: AdminNotification) => {
          // Include notifications with admin message title
          const isAdminMessageTitle = notification.title === 'Nouveau message de l\'admin';
          
          // Include notifications where sender is admin
          const isAdminSender = 
            (notification.data?.users as any)?.[0]?._id === 'admin' ||
            (notification.data?.users as any)?.[0]?.AccountType === 'admin' ||
            notification.data?.senderId === 'admin' ||
            (notification.data?.sender as any)?._id === 'admin' ||
            (notification.data?.sender as any)?.AccountType === 'admin';
          
          // Include MESSAGE_ADMIN and MESSAGE_RECEIVED types
          const isCorrectType = notification.type === 'MESSAGE_ADMIN' || notification.type === 'MESSAGE_RECEIVED';
          
          return (isAdminMessageTitle || isAdminSender) && isCorrectType;
        });
        
        console.log('AdminHook: Found', adminMessageNotifications.length, 'admin message notifications from database');
        console.log('AdminHook: Unread count:', adminMessageNotifications.filter((n: AdminNotification) => !n.read).length);
        setAdminNotifications(adminMessageNotifications);
      }
    } catch (err) {
      console.error('Error fetching admin message notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Calculate total unread count for admin messages
  const totalUnreadCount = useMemo(() => {
    return adminNotifications.filter(notification => !notification.read).length;
  }, [adminNotifications]);

  // Calculate unread count for ONLY admin messages (not notifications)
  const unreadAdminMessagesCount = useMemo(() => {
    // Count unread admin notifications from database (existing notifications)
    const unreadAdminNotifications = adminNotifications.filter(n => !n.read);
    
    // Count socket messages that are from admin and unread (new real-time messages)
    const unreadAdminSocketMessages = (socketMessages as any[]).filter(msg => {
      // Must be unread
      if (msg.isUnRead === false) return false;
      
      // Must be from admin
      const isFromAdmin = 
        msg.sender === 'admin' || 
        msg.senderId === 'admin' || 
        msg.sender?._id === 'admin';
      
      if (!isFromAdmin) return false;
      
      // Must be for current user
      const isForCurrentUser = 
        msg.receiver === currentUserId || 
        msg.receiverId === currentUserId || 
        msg.reciver === currentUserId;
      
      if (!isForCurrentUser) return false;
      
      return true;
    });
    
    // Total count = existing notifications + new socket messages
    const totalCount = unreadAdminNotifications.length + unreadAdminSocketMessages.length;
    
    console.log('AdminHook: Unread admin messages breakdown:', {
      unreadAdminNotifications: unreadAdminNotifications.length,
      unreadAdminSocketMessages: unreadAdminSocketMessages.length,
      totalCount
    });
    
    return totalCount;
  }, [adminNotifications, socketMessages, currentUserId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    console.log('🔄 Refreshing admin message notifications');
    setLoading(true);
    await fetchAdminNotifications();
  }, []); // Remove fetchAdminNotifications dependency

  // Handle new admin messages from socket
  const handleNewAdminMessage = useCallback((data: any) => {
    console.log('📨 New admin message received:', data);
    
    // Check if message is from admin
    const isFromAdmin = 
      data.sender === 'admin' || 
      data.senderId === 'admin' || 
      data.sender?._id === 'admin';
    
    if (!isFromAdmin) {
      console.log('❌ Message not from admin, ignoring');
      return;
    }
    
          // Check if message is for current user - support both receiver and reciver spellings
      const isForCurrentUser = 
        data.receiver === currentUserId || 
        data.receiverId === currentUserId || 
        data.reciver === currentUserId ||
        data.reciverId === currentUserId;
    
    if (!isForCurrentUser) {
      console.log('❌ Message not for current user, ignoring');
      return;
    }
    
    // Prevent duplicate processing
    const now = Date.now();
    const messageId = data._id || data.id || `${data.sender}-${data.receiver}-${now}`;
    const cacheKey = `${messageId}-${data.createdAt || now}`;
    
    if (adminMessageNotificationCache.processedMessages.has(cacheKey)) {
      console.log('🚫 Message already processed, skipping');
      return;
    }
    
    // Check if message already exists in state
    setSocketMessages(prev => {
      const exists = prev.some(msg => 
        msg._id === messageId || 
        (msg.sender === data.sender && 
         msg.receiver === data.receiver && 
         msg.message === data.message &&
         Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt || now).getTime()) < 1000)
      );
      
      if (exists) {
        console.log("🚫 Admin message already exists in state");
        return prev;
      }
      
      // Add new admin message
      const newAdminMessage = {
        ...data,
        _id: messageId,
        isUnRead: true,
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      console.log("✅ Adding new admin message to state:", newAdminMessage);
      return [...prev, newAdminMessage];
    });
    
    // Update cache
    adminMessageNotificationCache.processedMessages.add(cacheKey);
    adminMessageNotificationCache.lastProcessedTime = now;
  }, [currentUserId]);

  // Function to clear socket messages (when chat is opened)
  const clearSocketMessages = useCallback(() => {
    console.log("🧹 Clearing socket messages");
    setSocketMessages([]);
    // Clear cache
    adminMessageNotificationCache.processedMessages.clear();
    adminMessageNotificationCache.lastProcessedTime = 0;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('📝 Marking admin notification as read:', notificationId);
      
      // Optimistic update
      setAdminNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );

      // Make API call to mark as read
      const { auth } = authStore.getState();
      if (auth?.tokens?.accessToken) {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.tokens.accessToken}`
          }
        });

        if (!response.ok) {
          console.error('❌ Error marking admin notification as read:', response.status);
          // Revert optimistic update on error
          setAdminNotifications(prev => 
            prev.map(notification => 
              notification._id === notificationId 
                ? { ...notification, read: false } 
                : notification
            )
          );
        } else {
          console.log('✅ Admin notification marked as read successfully');
          
          // Refresh admin notifications to get the latest data from server
          await fetchAdminNotifications();
          console.log('🔄 Admin notifications refreshed after marking as read');
        }
      }
    } catch (error) {
      console.error('❌ Error marking admin notification as read:', error);
    }
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socketContext?.socket) return;
    
    console.log('🔌 Setting up admin message socket listeners');
    
    socketContext.socket.on('sendMessage', handleNewAdminMessage);
    socketContext.socket.on('newMessage', handleNewAdminMessage);
    
    // Add specific listener for adminMessage events - highest priority
    socketContext.socket.on('adminMessage', (data) => {
      console.log('📨 Admin message event received:', data);
      // Always process adminMessage events with high priority
      handleNewAdminMessage({
        ...data,
        isHighPriority: true // Mark as high priority
      });
    });
    
    socketContext.socket.on('notification', (notification) => {
      // Handle admin notifications
      if (notification.type === 'MESSAGE_ADMIN' && notification.userId === currentUserId) {
        console.log('📨 Admin notification received:', notification);
        // This will be handled by the database notifications
      }
    });
    
    return () => {
      console.log('🔌 Cleaning up admin message socket listeners');
      socketContext.socket?.off('sendMessage', handleNewAdminMessage);
      socketContext.socket?.off('newMessage', handleNewAdminMessage);
      socketContext.socket?.off('adminMessage');
      socketContext.socket?.off('notification');
    };
  }, [socketContext?.socket, handleNewAdminMessage, currentUserId]);

  // Only fetch notifications when auth is ready
  useEffect(() => {
    if (isReady) {
      console.log('🔄 Auth ready - fetching admin notifications');
      fetchAdminNotifications();
    }
  }, [isReady]); // Only depend on isReady

  // Fetch notifications when user comes online (socket connects) - but only once
  useEffect(() => {
    if (socketContext?.socket?.connected && currentUserId && isReady) {
      console.log('🔄 User came online - fetching admin notifications');
      fetchAdminNotifications();
    }
  }, [socketContext?.socket?.connected, currentUserId, isReady]); // Only depend on connection status and user

  // Only log when state actually changes to reduce spam
  useEffect(() => {
    console.log('AdminHook: Admin message notifications state:', {
      totalUnreadCount,
      notificationsCount: adminNotifications.length,
      loading
    });
  }, [totalUnreadCount, adminNotifications.length, loading]);

  return {
    adminNotifications,
    socketMessages,
    totalUnreadCount,
    unreadAdminMessagesCount,
    loading,
    refreshNotifications,
    clearSocketMessages,
    markAsRead
  };
}

export default useAdminMessageNotifications; 