import axios from 'axios';
import { authStore } from '@/contexts/authStore';
import app from '@/config';

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
      
      const response = await axios.get(`${app.baseURL}notification/general`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
        },
        withCredentials: false,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        // Gracefully handle missing API route or empty data
        if (status === 404) {
          return { notifications: [] };
        }
      }
      // Fallback: do not break UI
      return { notifications: [] };
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
        `${app.baseURL}notification/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
          },
          withCredentials: false,
        }
      );
      return response.data;
    } catch (error: unknown) {
      // Swallow 404s to avoid noisy errors if API route is unavailable
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { success: false };
      }
      return { success: false };
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
        `${app.baseURL}notification/read-all`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
          },
          withCredentials: false,
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { success: false };
      }
      return { success: false };
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
      
      const response = await axios.get(`${app.baseURL}notification/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
        },
        withCredentials: false,
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching unread count:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
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
        `${app.baseURL}notification/chat/${chatId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER as string,
          },
          withCredentials: false,
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { success: false };
      }
      return { success: false };
    }
  }
}; 