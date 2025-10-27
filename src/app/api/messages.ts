import { requests } from "./utils";

interface Message {
  _id: string;
  message: string;
  sender: string;
  reciver: string;
  idChat: string;
  createdAt: string;
  updatedAt?: string;
  attachment?: {
    _id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    filename: string;
  };
}

interface SendMessageData {
  message: string;
  sender: string;
  reciver: string;
  idChat: string;
  attachment?: {
    _id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    filename: string;
  };
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const MessageAPI = {
  // Unified message sending - handles both authenticated and guest users
  sendMessage: async (messageData: {
    message: string;
    sender?: string;
    reciver?: string;
    idChat?: string;
    guestName?: string;
    guestPhone?: string;
    attachment?: {
      _id: string;
      url: string;
      name: string;
      type: string;
      size: number;
      filename: string;
    };
  }, isGuest: boolean = false): Promise<ApiResponse<Message>> => {
    try {
      console.log('📤 Unified message sending:', { messageData, isGuest });
      
      if (!messageData.message || !messageData.message.trim()) {
        throw new Error('Message cannot be empty');
      }
      
      if (isGuest) {
        // Guest user flow
        if (!messageData.guestName || !messageData.guestPhone) {
          throw new Error('Guest name and phone are required');
        }
        
        const guestData = {
          message: messageData.message.trim(),
          guestName: messageData.guestName,
          guestPhone: messageData.guestPhone,
          idChat: messageData.idChat || '',
          attachment: messageData.attachment
        };
        
        console.log('📤 Sending guest message:', guestData);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/message/guest-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-key': '64d2e8b7c3a9f1e5d8b2a4c6e9f0d3a5'
          },
          body: JSON.stringify(guestData)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Guest message sent successfully:', data);
          return {
            success: true,
            data: data,
            message: 'Guest message sent successfully'
          };
        } else {
          const errorText = await response.text();
          console.error('❌ Guest message failed:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } else {
        // Authenticated user flow
        if (!messageData.sender || !messageData.reciver || !messageData.idChat) {
          throw new Error('Sender, receiver, and chat ID are required for authenticated users');
        }
        
        const authMessageData = {
          idChat: messageData.idChat,
          message: messageData.message.trim(),
          sender: messageData.sender,
          reciver: messageData.reciver,
          attachment: messageData.attachment
        };
        
        console.log('📤 Sending authenticated message:', authMessageData);
        
        // Try multiple endpoint variations for authenticated users
        try {
          console.log('📤 Trying primary endpoint: message/create');
          const res = await requests.post('message/create', authMessageData);
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
          console.log('⚠️ Primary message endpoint failed, trying alternative:', primaryError);
          
          try {
            console.log('📤 Trying secondary endpoint: chat/messages');
            const res = await requests.post('chat/messages', authMessageData);
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
            
            console.log('📤 Trying final endpoint: messages');
            const res = await requests.post('messages', authMessageData);
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
      }
    } catch (error: unknown) {
      console.error('❌ Error in unified message sending:', error);
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

  // Legacy method for backward compatibility - authenticated users only
  send: async (messageData: SendMessageData): Promise<ApiResponse<Message>> => {
    try {
      console.log('📤 Sending message data (legacy method):', messageData);
      
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

  // Legacy method for guest messages - backward compatibility
  sendGuestMessage: async (guestData: {
    message: string;
    guestName: string;
    guestPhone: string;
    idChat?: string;
  }): Promise<ApiResponse<Message>> => {
    try {
      console.log('📤 Sending guest message (legacy method):', guestData);
      
      if (!guestData.message || !guestData.message.trim()) {
        throw new Error('Message cannot be empty');
      }
      
      if (!guestData.guestName || !guestData.guestName.trim()) {
        throw new Error('Guest name is required');
      }
      
      if (!guestData.guestPhone || !guestData.guestPhone.trim()) {
        throw new Error('Guest phone is required');
      }
      
      // Use direct fetch to bypass axios interceptors that might cause redirects
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/message/guest-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-key': '64d2e8b7c3a9f1e5d8b2a4c6e9f0d3a5'
          // No Authorization header - this is a public endpoint
        },
        body: JSON.stringify(guestData)
      });
      
      console.log('📡 Guest message response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Guest message sent successfully:', data);
        return {
          success: true,
          data: data,
          message: 'Guest message sent successfully'
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Guest message failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error: unknown) {
      console.error('❌ Error sending guest message:', error);
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

  // Get all messages for a conversation
  getByConversation: async (chatId: string, options: any = {}, isGuest: boolean = false): Promise<ApiResponse<Message[]>> => {
    try {
      // For guest users, use direct fetch to bypass authentication
      if (isGuest) {
        console.log('📤 Getting messages for guest user');
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/message/getAll/${chatId}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-access-key': '64d2e8b7c3a9f1e5d8b2a4c6e9f0d3a5'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Guest messages retrieved:', data);
          return {
            success: true,
            data: Array.isArray(data) ? data : [],
            message: 'Messages retrieved successfully'
          };
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to get guest messages:', response.status, errorText);
          return {
            data: [],
            success: false,
            message: 'Failed to retrieve messages'
          };
        }
      }
      
      // For authenticated users, use the existing logic
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
