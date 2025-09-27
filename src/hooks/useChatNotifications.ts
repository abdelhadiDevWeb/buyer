import { useState, useEffect, useCallback } from 'react';
import { useCreateSocket } from '@/contexts/socket';

interface ChatNotification {
  id: string;
  name: string;
  message: string;
  unread: number;
  time: string;
  avatar: string;
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

export function useChatNotifications() {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketContext = useCreateSocket();

  // Move fetchNotifications outside useEffect and wrap in useCallback
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Get userId and token from localStorage
      const auth = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
      if (!auth) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      const { user, tokens } = JSON.parse(auth);
      const userId = user._id;
      const token = tokens.accessToken;
      // Fetch notifications from API
      const response = await fetch('/api/chat-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      
      // Format dates before setting notifications
      const formattedNotifications = data.notifications.map((notification: ChatNotification) => ({
        ...notification,
        time: formatDate(notification.time)
      }));
      
      setNotifications(formattedNotifications);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Remove polling - only fetch on mount or manual refresh
    // const intervalId = setInterval(fetchNotifications, 10000);
    // return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Listen for new messages from socket and refresh notifications in real-time
  useEffect(() => {
    if (!socketContext) return;
    
    // Handle incoming socket messages
    const handleNewMessage = () => {
      fetchNotifications();
    };
    
    // Subscribe to socket events
    if (socketContext.socket) {
      socketContext.socket.on('newMessage', handleNewMessage);
      socketContext.socket.on('messageRead', handleNewMessage);
    }
    
    // Check if we have pending messages
    if (socketContext.messages && 
        Array.isArray(socketContext.messages) && 
        socketContext.messages.length > 0) {
      fetchNotifications();
      // Clear messages after refresh
      if (typeof socketContext.setMessages === 'function') {
        socketContext.setMessages([]);
      }
    }
    
    // Cleanup function
    return () => {
      if (socketContext.socket) {
        socketContext.socket.off('newMessage', handleNewMessage);
        socketContext.socket.off('messageRead', handleNewMessage);
      }
    };
  }, [socketContext, fetchNotifications]);

  const totalUnread = notifications.reduce((total, notification) => total + notification.unread, 0);

  // Expose refresh function
  return { notifications, totalUnread, loading, error, refresh: fetchNotifications };
}

export default useChatNotifications; 