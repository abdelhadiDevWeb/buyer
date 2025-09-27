import axios from 'axios';
import { authStore } from '@/contexts/authStore';

// Use Next.js API routes instead of direct backend access
export const NotificationAPI = {
  // Get all notifications
  getAllNotifications: async () => {
    try {
      // Get auth token from authStore
      const { auth } = authStore.getState();
      const token = auth?.tokens?.accessToken;
      
      if (!token) {
        console.warn('No auth token available for getAllNotifications');
        return { notifications: [] };
      }
      
      const response = await axios.get('/api/notifications/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      // Get auth token from authStore
      const { auth } = authStore.getState();
      const token = auth?.tokens?.accessToken;
      
      if (!token) {
        console.warn('No auth token available for markAsRead');
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      // Get auth token from authStore
      const { auth } = authStore.getState();
      const token = auth?.tokens?.accessToken;
      
      if (!token) {
        console.warn('No auth token available for markAllAsRead');
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(
        '/api/notifications/read-all',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      // Get auth token from authStore
      const { auth } = authStore.getState();
      const token = auth?.tokens?.accessToken;
      
      if (!token) {
        console.warn('No auth token available for getUnreadCount');
        return 0; // Return 0 as fallback
      }
      
      const response = await axios.get('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      // Return 0 on error as a fallback
      return 0;
    }
  },

  // Mark all notifications for a specific chat as read
  markChatAsRead: async (chatId: string) => {
    try {
      // Get auth token from authStore
      const { auth } = authStore.getState();
      const token = auth?.tokens?.accessToken;
      
      if (!token) {
        console.warn('No auth token available for markChatAsRead');
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(
        `/api/notification/chat/${chatId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking chat notifications as read:', error);
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      throw error;
    }
  }
}; 