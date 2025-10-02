import { requests } from "./utils";

interface Message {
  _id: string;
  message: string;
  sender: string;
  reciver: string;
  idChat: string;
  createdAt: string;
  updatedAt?: string;
}

interface SendMessageData {
  message: string;
  sender: string;
  reciver: string;
  idChat: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const MessageAPI = {
  // Get all messages for a conversation
  getByConversation: async (chatId: string, options: any = {}): Promise<ApiResponse<Message[]>> => {
    try {
      // Try multiple endpoint versions
      try {
        console.log('📤 Trying to get messages at primary endpoint');
        const res = await requests.get(`message/getAll/${chatId}`, options);
        console.log('✅ Messages retrieved successfully:', res);
        if ('success' in res) {
          return res as ApiResponse<Message[]>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
          message: (res as any)?.data?.message,
        } as ApiResponse<Message[]>;
      } catch (primaryError) {
        console.log('⚠️ Primary get messages endpoint failed, trying alternative:', primaryError);
        
        // Fallback to alternative endpoint
        const res = await requests.get(`chat/messages/${chatId}`, options);
        console.log('✅ Messages retrieved at fallback endpoint:', res);
        if ('success' in res) {
          return res as ApiResponse<Message[]>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
          message: (res as any)?.data?.message,
        } as ApiResponse<Message[]>;
      }
    } catch (error: unknown) {
      console.error('❌ Error retrieving messages:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data: any } };
        if (axiosError.response) {
          console.error('📡 Response status:', axiosError.response.status);
          console.error('📡 Response data:', axiosError.response.data);
        }
      }
      // Return empty array instead of throwing to prevent UI errors
      return { data: [], success: false, message: 'Failed to retrieve messages' };
    }
  },

  // Send a new message
  send: async (messageData: SendMessageData): Promise<ApiResponse<Message>> => {
    try {
      console.log('📤 Sending message data:', messageData);
      
      if (!messageData.idChat) {
        console.error('❌ Missing idChat in message data');
        throw new Error('Missing required field: idChat');
      }
      
      if (!messageData.sender) {
        console.error('❌ Missing sender in message data');
        throw new Error('Missing required field: sender');
      }
      
      if (!messageData.reciver) {
        console.error('❌ Missing reciver in message data');
        throw new Error('Missing required field: reciver');
      }
      
      if (!messageData.message || !messageData.message.trim()) {
        console.error('❌ Empty message in message data');
        throw new Error('Message cannot be empty');
      }
      
      // Try multiple endpoint variations
      try {
        // First try the most likely endpoint
        console.log('📤 Trying primary endpoint: message/create');
        const res = await requests.post('message/create', messageData);
        console.log('✅ Message sent successfully via primary endpoint:', res);
        if ('success' in res) {
          return res as ApiResponse<Message>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data,
          message: (res as any)?.data?.message,
        } as ApiResponse<Message>;
      } catch (primaryError) {
        console.log('⚠️ Primary message endpoint failed, trying alternative 1:', primaryError);
        
        try {
          // Try second endpoint option
          console.log('📤 Trying secondary endpoint: chat/messages');
          const res = await requests.post('chat/messages', messageData);
          console.log('✅ Message sent successfully via secondary endpoint:', res);
          if ('success' in res) {
            return res as ApiResponse<Message>;
          }
          return {
            success: (res as any)?.status >= 200 && (res as any)?.status < 300,
            data: (res as any)?.data?.data ?? (res as any)?.data,
            message: (res as any)?.data?.message,
          } as ApiResponse<Message>;
        } catch (secondaryError) {
          console.log('⚠️ Secondary message endpoint failed, trying final option:', secondaryError);
          
          // Last attempt with different endpoint
          console.log('📤 Trying final endpoint: messages');
          const res = await requests.post('messages', messageData);
          console.log('✅ Message sent successfully via final endpoint:', res);
          if ('success' in res) {
            return res as ApiResponse<Message>;
          }
          return {
            success: (res as any)?.status >= 200 && (res as any)?.status < 300,
            data: (res as any)?.data?.data ?? (res as any)?.data,
            message: (res as any)?.data?.message,
          } as ApiResponse<Message>;
        }
      }
    } catch (error: unknown) {
      console.error('❌ Error sending message - all endpoints failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data: any } };
        if (axiosError.response) {
          console.error('📡 Response status:', axiosError.response.status);
          console.error('📡 Response data:', axiosError.response.data);
        }
      }
      throw error;
    }
  },

  // Mark all messages in a conversation as read
  markAllAsRead: async (chatId: string): Promise<ApiResponse<any>> => {
    try {
      // Try multiple endpoint versions
      try {
        console.log('📤 Trying to mark messages as read at primary endpoint');
        const res = await requests.post(`message/mark-read/${chatId}`, {});
        console.log('✅ Messages marked as read successfully:', res);
        if ('success' in res) {
          return res as ApiResponse<any>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data,
          message: (res as any)?.data?.message,
        } as ApiResponse<any>;
      } catch (primaryError) {
        console.log('⚠️ Primary mark-read endpoint failed, trying alternative:', primaryError);
        
        // Fallback to alternative endpoint
        const res = await requests.put(`chat/messages/${chatId}/mark-read`, {});
        console.log('✅ Messages marked as read at fallback endpoint:', res);
        if ('success' in res) {
          return res as ApiResponse<any>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data,
          message: (res as any)?.data?.message,
        } as ApiResponse<any>;
      }
    } catch (error: unknown) {
      console.error('❌ Error marking messages as read:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data: any } };
        if (axiosError.response) {
          console.error('📡 Response status:', axiosError.response.status);
          console.error('📡 Response data:', axiosError.response.data);
        }
      }
      throw error;
    }
  },

  // Get all messages (legacy method)
  getMessages: async (): Promise<ApiResponse<Message[]>> => {
    try {
      const res = await requests.get('messages');
      if ('success' in res) {
        return res as ApiResponse<Message[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Message[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  // Mark chat as read (messages and notifications)
  markChatAsRead: async (chatId: string, userId: string): Promise<ApiResponse<any>> => {
    try {
      console.log('📤 Marking chat as read:', { chatId, userId });
      const res = await requests.post('message/mark-chat-read', { chatId, userId });
      console.log('✅ Chat marked as read successfully:', res);
      if ('success' in res) {
        return res as ApiResponse<any>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<any>;
    } catch (error: unknown) {
      console.error('❌ Error marking chat as read:', error);
      throw error;
    }
  },

  // Get unread messages for user
  getUnreadMessages: async (userId: string): Promise<ApiResponse<Message[]>> => {
    try {
      console.log('📤 Getting unread messages for user:', userId);
      const res = await requests.get(`message/unread-messages/${userId}`);
      console.log('✅ Unread messages retrieved successfully:', res);
      if ('success' in res) {
        return res as ApiResponse<Message[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Message[]>;
    } catch (error: unknown) {
      console.error('❌ Error getting unread messages:', error);
      throw error;
    }
  },
};
