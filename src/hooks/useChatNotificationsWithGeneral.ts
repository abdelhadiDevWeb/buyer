import { useState, useCallback, useEffect } from 'react';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';

interface ChatNotification {
  _id: string;
  chatId: string;
  message: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  unread: number;
  createdAt: string;
}

interface GeneralNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}


export function useChatNotificationsWithGeneral() {
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [chatCreatedNotifications, setChatCreatedNotifications] = useState<GeneralNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketContext = useCreateSocket();
  const auth = authStore((state) => state.auth);
  const isReady = authStore((state) => state.isReady);

  const fetchChatNotifications = useCallback(async () => {
    try {
      // Get current auth state to avoid dependency issues
      const currentAuth = authStore.getState().auth;
      const currentIsReady = authStore.getState().isReady;
      
      // Wait for auth to be ready
      if (!currentIsReady) {
        console.log('Auth not ready yet, skipping chat notifications fetch');
        return;
      }

      // Check if user is authenticated
      if (!currentAuth?.user?._id || !currentAuth?.tokens?.accessToken) {
        console.log('User not authenticated, setting empty chat notifications');
        setChatNotifications([]);
        return;
      }

      const userId = currentAuth.user._id;
      const token = currentAuth.tokens.accessToken;
      
      const response = await fetch('/api/chat-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching chat notifications:', err);
    }
  }, []); // Remove dependencies to prevent infinite loops

  const fetchChatCreatedNotifications = useCallback(async () => {
    try {
      // Get current auth state to avoid dependency issues
      const currentAuth = authStore.getState().auth;
      const currentIsReady = authStore.getState().isReady;
      
      // Wait for auth to be ready
      if (!currentIsReady) {
        console.log('Auth not ready yet, skipping chat created notifications fetch');
        return;
      }

      // Check if user is authenticated
      if (!currentAuth?.user?._id || !currentAuth?.tokens?.accessToken) {
        console.log('User not authenticated, setting empty chat created notifications');
        setChatCreatedNotifications([]);
        return;
      }

      const userId = currentAuth.user._id;
      const token = currentAuth.tokens.accessToken;
      
      const response = await fetch('/api/notifications/chat', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const chatRelatedNotifications = data.notifications || [];
        
        console.log('ChatHook: Found chat-related notifications:', chatRelatedNotifications.length);
        console.log('ChatHook: Chat notifications details:', chatRelatedNotifications.map((n: any) => ({
          id: n._id,
          title: n.title,
          type: n.type,
          read: n.read,
          senderId: n.senderId,
          senderName: n.senderName,
          senderEmail: n.senderEmail,
          createdAt: n.createdAt
        })));
        
        // No need to filter - API already returns only unread chat notifications
        setChatCreatedNotifications(chatRelatedNotifications);
        
        console.log('📊 Chat notifications unread count:', chatRelatedNotifications.length);
      }
    } catch (err) {
      console.error('Error fetching chat created notifications:', err);
    }
  }, []); // Remove dependencies to prevent infinite loops

  const fetchAllChatRelatedNotifications = useCallback(async () => {
    setLoading(true);
    console.log('ChatHook: Fetching all chat-related notifications');
    await Promise.all([
      fetchChatNotifications(),
      fetchChatCreatedNotifications()
    ]);
    setLoading(false);
  }, []); // Remove function dependencies to prevent infinite loops

  // Only fetch notifications when auth is ready
  useEffect(() => {
    if (isReady) {
      fetchAllChatRelatedNotifications();
    }
  }, [isReady]); // Remove fetchAllChatRelatedNotifications dependency

  useEffect(() => {
    if (!socketContext?.socket) return;
    
    const handleNewMessage = () => {
      fetchChatNotifications();
    };

    const handleNewNotification = () => {
      fetchChatCreatedNotifications();
    };
    
    socketContext.socket.on('newMessage', handleNewMessage);
    socketContext.socket.on('messageRead', handleNewMessage);
    socketContext.socket.on('notification', handleNewNotification);
    socketContext.socket.on('sendNotificationChatCreate', handleNewNotification);
    
    return () => {
      socketContext.socket?.off('newMessage', handleNewMessage);
      socketContext.socket?.off('messageRead', handleNewMessage);
      socketContext.socket?.off('notification', handleNewNotification);
      socketContext.socket?.off('sendNotificationChatCreate', handleNewNotification);
    };
  }, [socketContext]); // Remove function dependencies

  const chatMessagesUnread = chatNotifications.reduce((total, notification) => total + notification.unread, 0);
  const chatCreatedUnread = chatCreatedNotifications.length; // API already returns only unread notifications
  const totalUnread = chatMessagesUnread + chatCreatedUnread;

  console.log('ChatHook: Chat messages unread:', chatMessagesUnread);
  console.log('ChatHook: Chat created unread:', chatCreatedUnread);
  console.log('ChatHook: Total chat unread:', totalUnread);

  return { 
    chatNotifications, 
    chatCreatedNotifications,
    totalUnread, 
    loading, 
    error, 
    refresh: fetchAllChatRelatedNotifications 
  };
}

export default useChatNotificationsWithGeneral;