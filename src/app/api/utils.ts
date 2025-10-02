import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import app from '@/config';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  user?: T;
  message?: string;
  success: boolean;
  requiresPhoneVerification?: boolean;
  tokens?: any;
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  [key: string]: any; // Allow for additional fields
}

// Enhanced token retrieval function
const getTokenFromStorage = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      const token = parsed?.tokens?.accessToken;
      if (token && typeof token === 'string' && token.trim() !== '') {
        console.log('🔑 Token found in localStorage');
        return token;
      }
    }
    
    // Only warn for authenticated endpoints, not auth endpoints
    return null;
  } catch (error) {
    console.error('⚠️ Error getting token from storage:', error);
    return null;
  }
};

const instance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

// Add request interceptor to automatically attach auth token
instance.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage();
    
    // Only attach token for non-auth endpoints
    const isAuthEndpoint = config.url?.includes('auth/signin') || 
                          config.url?.includes('auth/signup') || 
                          config.url?.includes('auth/refresh') ||
                          config.url?.includes('auth/reset-password');
    
    if (token && !isAuthEndpoint) {
      config.headers = config.headers || {};
      // Ensure proper Bearer format
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authHeader;
      console.log('🔑 Auth token attached to request:', config.url);
    } else if (!isAuthEndpoint && !token) {
      console.warn('⚠️ No auth token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('🔒 401 Unauthorized - Token may be expired');
      originalRequest._retry = true;
      
      // Only redirect if this is NOT a login/signup request (to avoid redirecting during login attempts)
      const isLoginRequest = originalRequest.url?.includes('auth/signin') || originalRequest.url?.includes('auth/signup');
      
      if (!isLoginRequest) {
        // Clear auth data on 401 (only for non-login requests)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth');
          
          // Try to get authStore and logout
          try {
            const { authStore } = await import('@/contexts/authStore');
            authStore.getState().logout();
          } catch (e) {
            console.warn('Could not access auth store for logout');
          }
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/signin') {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced response handler that properly handles different API response structures
const responseBody = (res: AxiosResponse): ApiResponse => {
  const responseData = res.data;
  
  console.log('🔍 Processing response:', {
    status: res.status,
    dataType: typeof responseData,
    isArray: Array.isArray(responseData),
    hasSuccess: 'success' in (responseData || {}),
    hasData: 'data' in (responseData || {}),
    keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : []
  });
  
  // Handle different response structures
  if (responseData && typeof responseData === 'object') {
    
    // Case 1: Standard API wrapper with success and data fields
    if ('success' in responseData && 'data' in responseData) {
      console.log('✅ Standard API response format detected');
      return responseData as ApiResponse;
    }
    
    // Case 2: Response has success but data is at root level
    if ('success' in responseData && !('data' in responseData)) {
      console.log('✅ API response with success flag, keeping original structure');
      // For responses that already have the correct structure (like subscription plans),
      // return as-is instead of moving to data field
      return responseData as ApiResponse;
    }
    
    // Case 3: Direct array response (common for list endpoints)
    if (Array.isArray(responseData)) {
      console.log('✅ Direct array response detected');
      return {
        data: responseData,
        success: true,
        message: 'Request successful'
      } as ApiResponse;
    }
    
    // Case 4: Object response without wrapper (treat as data)
    if (!('success' in responseData) && !Array.isArray(responseData)) {
      console.log('✅ Direct object response, wrapping in API format');
      return {
        data: responseData,
        success: res.status >= 200 && res.status < 300,
        message: responseData.message || 'Request successful'
      } as ApiResponse;
    }
    
    // Case 5: Response with data field but no success field
    if ('data' in responseData && !('success' in responseData)) {
      console.log('✅ Response has data field, adding success flag');
      return {
        ...responseData,
        success: res.status >= 200 && res.status < 300,
      } as ApiResponse;
    }
  }
  
  // Fallback: wrap primitive responses
  console.log('🔄 Fallback: wrapping primitive response');
  return {
    data: responseData,
    success: res.status >= 200 && res.status < 300,
    message: 'Request successful'
  } as ApiResponse;
};

// Export the axios instance
export { instance };

// Enhanced requests object with better error handling and logging
export const requests = {
  get: <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 GET request to:', url);
    return instance.get(url, config)
      .then(responseBody)
      .catch(error => {
        console.error('❌ GET request failed:', url, error.response?.data || error.message);
        throw error;
      });
  },

  post: <T = any>(url: string, body: {}, config = {}, returnFullResponse = false): Promise<ApiResponse<T> | AxiosResponse> => {
    console.log('🌐 POST request to:', url);
    const request = instance.post(url, body, config);
    
    if (returnFullResponse) {
      return request.catch(error => {
        console.error('❌ POST request failed:', url, error.response?.data || error.message);
        throw error;
      });
    }
    
    return request
      .then(responseBody)
      .catch(error => {
        console.error('❌ POST request failed:', url, error.response?.data || error.message);
        throw error;
      });
  },

  postFormData: <T = any>(url: string, formData: FormData, config: AxiosRequestConfig = {} as AxiosRequestConfig): Promise<ApiResponse<T>> => {
    console.log('🌐 POST FormData request to:', url);
    if (!formData) {
      throw new Error('FormData is required for postFormData');
    }
    
    return instance.post(url, formData, {
      ...(config || {}),
      headers: {
        'Content-Type': 'multipart/form-data',
        ...((config && (config as any).headers) ? (config as any).headers : {})
      }
    })
    .then(responseBody)
    .catch(error => {
      console.error('❌ POST FormData request failed:', url, error.response?.data || error.message);
      throw error;
    });
  },

  put: <T = any>(url: string, body: {}, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 PUT request to:', url);
    return instance.put(url, body, config)
      .then(responseBody)
      .catch(error => {
        console.error('❌ PUT request failed:', url, error.response?.data || error.message);
        throw error;
      });
  },

  patch: <T = any>(url: string, body: {}, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 PATCH request to:', url);
    return instance.patch(url, body, config)
      .then(responseBody)
      .catch(error => {
        console.error('❌ PATCH request failed:', url, error.response?.data || error.message);
        throw error;
      });
  },

  delete: <T = any>(url: string, config = {}): Promise<ApiResponse<T>> => {
    console.log('🌐 DELETE request to:', url);
    return instance.delete(url, config)
      .then(responseBody)
      .catch(error => {
        console.error('❌ DELETE request failed:', url, error.response?.data || error.message);
        throw error;
      });
  },
};