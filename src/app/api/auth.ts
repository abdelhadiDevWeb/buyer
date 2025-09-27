import Credentials from '@/types/Credentials';
import User from '@/types/User';
import { requests } from './utils';

interface AuthResponse {
  user: User;
  session?: {
    accessToken: string;
    refreshToken: string;
  };
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  message?: string;
  success: boolean;
  requiresPhoneVerification?: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AuthAPI = {
  signin: async (credentials: Credentials, returnFullResponse: boolean = true): Promise<AuthResponse> => {
    try {
      console.log('🔐 AuthAPI.signin called with:', { login: credentials.login, hasPassword: !!credentials.password });
      
      const res = await requests.post('auth/signin', credentials, {}, returnFullResponse);
      console.log('🔐 Full axios response:', res);
      console.log('🔐 Response data:', res.data);
      
      // Since returnFullResponse = true, we get the full axios response
      // The actual data is in res.data
      const responseData = res.data;
      
      console.log('🔐 AuthAPI.signin response received:', {
        hasUser: !!responseData?.user,
        hasSession: !!responseData?.session,
        hasTokens: !!(responseData?.session?.accessToken || responseData?.session?.access_token || responseData?.accessToken || responseData?.access_token),
        success: responseData?.success
      });

      if (!responseData?.user) {
        console.error('❌ No user found in response data:', responseData);
        throw new Error('Invalid response: no user data found');
      }

      // Normalize the response structure to handle different backend formats
      let normalizedResponse: AuthResponse = {
        user: responseData.user,
        success: responseData.success || true,
        message: responseData.message
      };

      // Handle different token response formats from backend
      if (responseData.session) {
        // Backend returns { data: { session: { access_token, refresh_token }, user } }
        normalizedResponse.session = {
          accessToken: responseData.session.accessToken || responseData.session.access_token,
          refreshToken: responseData.session.refreshToken || responseData.session.refresh_token
        };
        normalizedResponse.accessToken = normalizedResponse.session.accessToken;
        normalizedResponse.refreshToken = normalizedResponse.session.refreshToken;
      } else if (responseData.accessToken || responseData.access_token) {
        // Backend returns { data: { accessToken, refreshToken, user } }
        normalizedResponse.accessToken = responseData.accessToken || responseData.access_token;
        normalizedResponse.refreshToken = responseData.refreshToken || responseData.refresh_token;
        normalizedResponse.session = {
          accessToken: normalizedResponse.accessToken || '',
          refreshToken: normalizedResponse.refreshToken || ''
        };
      }

      console.log('🔐 Normalized signin response:', {
        hasTokens: !!(normalizedResponse.accessToken || normalizedResponse.session?.accessToken),
        tokenPreview: normalizedResponse.accessToken?.substring(0, 20) + '...' || 'N/A'
      });

      return normalizedResponse;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.signin failed:', error);
      throw error;
    }
  },

  signup: async (user: User): Promise<ApiResponse<User>> => {
    try {
      console.log('🔐 AuthAPI.signup called with:', { 
        firstName: user.firstName, 
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        type: user.type 
      });
      
      const res = await requests.post('auth/signup', user);
      console.log('🔐 AuthAPI.signup response:', {
        success: (res as any).success,
        hasUser: !!(res as any).data,
        requiresPhoneVerification: (res as any).requiresPhoneVerification,
        message: (res as any).message
      });
      
      return res as any;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.signup failed:', error);
      throw error;
    }
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      console.log('🔄 AuthAPI.refresh called with token:', refreshToken ? 'present' : 'missing');
      
      // Use the correct field name expected by backend
      const res = await requests.post('auth/refresh', { refresh_token: refreshToken });
      console.log('🔄 AuthAPI.refresh response:', {
        success: (res as any).success,
        hasTokens: !!((res as any).accessToken || (res as any).access_token)
      });
      
      // Normalize response format
      const normalizedResponse: AuthResponse = {
        user: (res as any).user,
        success: (res as any).success || true,
        accessToken: (res as any).accessToken || (res as any).access_token,
        refreshToken: (res as any).refreshToken || (res as any).refresh_token,
        message: (res as any).message
      };

      if (normalizedResponse.accessToken) {
        normalizedResponse.session = {
          accessToken: normalizedResponse.accessToken || '',
          refreshToken: normalizedResponse.refreshToken || ''
        };
      }

      return normalizedResponse;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.refresh failed:', error);
      throw error;
    }
  },

  signout: async (): Promise<ApiResponse<null>> => {
    try {
      console.log('🚪 AuthAPI.signout called');
      const res = await requests.delete('auth/signout');
      console.log('🚪 AuthAPI.signout response:', res);
      return res as any;
    } catch (error: any) {
      console.error('❌ AuthAPI.signout failed:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (data: { phone: string; code: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log('🔑 AuthAPI.resetPassword called for phone:', data.phone);
      const res = await requests.post('auth/reset-password/confirm', data);
      console.log('🔑 AuthAPI.resetPassword response:', res);
      return res as any;
    } catch (error: unknown) {
      console.error('❌ AuthAPI.resetPassword failed:', error);
      throw error;
    }
  },
};