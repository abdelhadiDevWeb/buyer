import { useState, useEffect, useCallback } from 'react';
import { useCreateSocket } from '@/contexts/socket';

interface GeneralNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to format dates
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if invalid date
  if (isNaN(date.getTime())) return dateString;
  
  // Today - show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }
  
  // This week - show day name
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  if (date > sixDaysAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  
  // Older - show date
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<GeneralNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // CORRECTED: Call the socket hook at the top level
  const socketContext = useCreateSocket();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Hook: Starting to fetch notifications');
      // Get userId and token from localStorage
      const auth = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
      if (!auth) {
        console.log('Hook: No auth found in localStorage');
        setNotifications([]);
        setLoading(false);
        return;
      }
      const { user, tokens } = JSON.parse(auth);
      const userId = user._id;
      const token = tokens.accessToken;
      console.log('Hook: Found auth', { userId, hasToken: !!token });
      
      // Fetch notifications from API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      
      console.log('Hook: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Hook: API error:', errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Hook: Received data:', data);
      
      const formattedNotifications = data.notifications.map((notification: GeneralNotification) => ({
        ...notification,
        formattedDate: formatDate(notification.createdAt)
      }));
      setNotifications(formattedNotifications);
      setLoading(false);
    } catch (err) {
      console.error('Hook: Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  // Initial fetch only - remove aggressive polling
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for new notifications from socket
  useEffect(() => {
    // Now you can safely use socketContext, as it's at the top level
    if (!socketContext || !socketContext.socket) {
      console.log('Socket context or socket is not available.');
      return;
    }

    const socket = socketContext.socket;
    
    const handleNotification = (data: Record<string, unknown>) => {
      console.log('Socket notification received:', data);
      
      if (data && data._id && data.title && data.message) {
        const formattedNotification = {
          ...data,
          formattedDate: formatDate(data.createdAt ? new Date(data.createdAt as string).toISOString() : new Date().toISOString())
        } as GeneralNotification & { formattedDate: string };
        
        setNotifications(prev => {
          const exists = prev.some(notif => notif._id === data._id);
          if (exists) return prev;
          
          return [formattedNotification, ...prev];
        });
        
        console.log('✅ Real-time: Added notification directly from socket:', formattedNotification);
      } else {
        console.log('⚠️ Socket notification incomplete - waiting for complete data:', data);
      }
    };
    
    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socketContext]);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const auth = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
      if (!auth) return;
      
      const { tokens } = JSON.parse(auth);
      const token = tokens.accessToken;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  return { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    refresh: fetchNotifications,
    markAsRead 
  };
}

export default useNotifications;