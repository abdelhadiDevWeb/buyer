import { requests } from './utils';

interface Chat {
  id?: string;
  _id?: string; // Support both id formats as returned from different endpoints
  participants?: string[];
  users?: Array<{ // Support both formats
    _id: string;
    firstName: string;
    lastName: string;
    AccountType: string;
  }>;
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const ChatAPI = {
  getChats: async (params?: { id: string; from: string }): Promise<ApiResponse<Chat[]>> => {
    try {
      console.log('🔍 ChatAPI.getChats called with params:', params);
      
      if (!params || !params.id) {
        console.error('❌ Missing required parameters: id and from');
        return {
          data: [],
          success: false,
          message: 'Missing required parameters'
        };
      }
      
      // Use the correct endpoint that matches the server implementation
      const endpoint = 'chat/getchats';
      
      try {
        console.log(`📤 Calling POST ${endpoint} with params:`, params);
        const res = await requests.post(endpoint, params);
        console.log(`✅ Success with POST ${endpoint}:`, res);
        if ('success' in res) {
          return res as ApiResponse<Chat[]>;
        }
        return {
          success: (res as any)?.status >= 200 && (res as any)?.status < 300,
          data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
          message: (res as any)?.data?.message,
        } as ApiResponse<Chat[]>;
      } catch (endpointError) {
        console.error(`❌ Endpoint ${endpoint} failed:`, endpointError);
        
        // Return empty array on error instead of trying other endpoints
        const errorMessage = (endpointError && typeof endpointError === 'object' && 'message' in endpointError)
          ? String((endpointError as any).message)
          : 'Unknown error';
        return {
          data: [],
          success: false,
          message: `Failed to fetch chats: ${errorMessage}`
        };
      }
      
    } catch (error: unknown) {
      console.error('❌ ChatAPI error:', error);
      // Return empty array instead of throwing error
      return {
        data: [],
        success: false,
        message: 'Failed to fetch chats'
      };
    }
  },
  
  // Create a new chat conversation
  createChat: async (chatData: any): Promise<ApiResponse<Chat>> => {
    try {
      console.log('📝 Creating new chat with data:', chatData);
      
      // Try different endpoint variations
      const endpoints = [
        'chat',
        'chats',
        'chat/create',
        'conversations'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📤 Trying to create chat at endpoint: ${endpoint}`);
          const res = await requests.post(endpoint, chatData);
          console.log(`✅ Chat created successfully at ${endpoint}:`, res);
          if ('success' in res) {
            return res as ApiResponse<Chat>;
          }
          return {
            success: (res as any)?.status >= 200 && (res as any)?.status < 300,
            data: (res as any)?.data?.data ?? (res as any)?.data,
            message: (res as any)?.data?.message,
          } as ApiResponse<Chat>;
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }
      
      // If all endpoints fail, create a fallback chat object
      console.log('⚠️ All chat creation endpoints failed, creating fallback chat');
      const fallbackChat: Chat = {
        _id: `fallback-chat-${Date.now()}`,
        users: chatData.users,
        createdAt: chatData.createdAt || new Date().toISOString()
      };
      
      return {
        data: fallbackChat,
        success: true,
        message: 'Chat created locally (API endpoints unavailable)'
      };
      
    } catch (error: unknown) {
      console.error('❌ Error creating chat:', error);
      // Return fallback chat instead of throwing error
      const fallbackChat: Chat = {
        _id: `error-chat-${Date.now()}`,
        users: chatData.users || [],
        createdAt: new Date().toISOString()
      };
      
      return {
        data: fallbackChat,
        success: false,
        message: 'Failed to create chat via API'
      };
    }
  },
};
