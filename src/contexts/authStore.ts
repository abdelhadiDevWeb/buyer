import User from '@/types/User';
import { create } from 'zustand';

const initialState: { tokens?: { accessToken: string; refreshToken: string }; user?: User } = {
  tokens: undefined,
  user: undefined,
};

interface IAuthStore {
  isReady: boolean;
  isLogged: boolean;
  auth: typeof initialState;
  set: (auth: Partial<typeof initialState>) => void;
  clear: () => void;
  logout: () => void;
  initializeAuth: () => void;
  testTokenStorage: () => void;
  refreshAuthState: () => void;
  fetchFreshUserData: () => Promise<void>;
  setupInterceptors: () => void;
}

export const authStore = create<IAuthStore>((setValues) => ({
  isReady: true,
  isLogged: false,
  auth: initialState,

  set: (auth: Partial<typeof initialState>) => {
    console.log('🔄 Setting auth data:', { hasUser: !!auth.user, hasTokens: !!auth.tokens });
    
    if (auth.user) {
      // Map backend user fields to frontend User type
      auth.user = {
        ...auth.user,
        displayName: auth.user.firstName,
        type: auth.user.type || 'CLIENT',
        email: auth.user.email || '',
        photoURL: auth.user.photoURL || '/static/mock-images/avatars/avatar_24.jpg',
        firstName: auth.user.firstName || '',
        lastName: auth.user.lastName || '',
        phone: auth.user.phone || '',
        rate: auth.user.rate || 1,
        avatar: auth.user.avatar || null,
      } as User;
    }

    setValues((state) => {
      const newAuth = { ...state.auth, ...auth };
      const isLogged = !!(newAuth.user && newAuth.tokens?.accessToken);
      
      console.log('🎯 Auth state update:', { 
        hasUser: !!newAuth.user, 
        hasTokens: !!newAuth.tokens, 
        hasAccessToken: !!newAuth.tokens?.accessToken,
        isLogged 
      });
      
      return { auth: newAuth, isLogged, isReady: true };
    });

    // Store in localStorage with proper structure
    if (typeof window !== 'undefined') {
      const authData = {
        user: auth.user,
        tokens: auth.tokens,
      };
      
      console.log('💾 Storing auth data in localStorage');
      window.localStorage.setItem('auth', JSON.stringify(authData));
      
      // Verify storage
      const stored = window.localStorage.getItem('auth');
      if (stored) {
        console.log('✅ Auth data stored successfully');
      }
    }
  },

  clear: () => {
    console.log('🧹 Clearing auth data');
    setValues(() => ({ auth: initialState, isLogged: false }));
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  },

  logout: () => {
    console.log('🚪 Logging out user');
    setValues(() => ({ auth: initialState, isLogged: false, isReady: true }));
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  },

  setupInterceptors: async () => {
    console.log('🔧 Interceptors are automatically set up in utils.ts');
  },

  initializeAuth: () => {
    console.log('🔄 Initializing auth...');
    if (typeof window === 'undefined') {
      console.log('⚠️ Window is undefined, skipping auth initialization');
      return;
    }
    
    const authentication = window.localStorage.getItem('auth');
    console.log('📦 Auth data from localStorage:', authentication ? 'Found' : 'Not found');

    let values;

    if (authentication) {
      try {
        const parsed = JSON.parse(authentication);
        console.log('✅ Parsed auth data successfully');
        
        // Validate the stored data structure
        if (parsed.user && parsed.tokens && parsed.tokens.accessToken && parsed.tokens.refreshToken) {
          console.log('🔑 Valid tokens found in storage');
          console.log('🔑 Access token length:', parsed.tokens.accessToken.length);
          
          // Map user data to ensure compatibility
          const mappedUser = {
            ...parsed.user,
            displayName: parsed.user.firstName,
            type: parsed.user.type || 'CLIENT',
            email: parsed.user.email || '',
            photoURL: parsed.user.photoURL || '/static/mock-images/avatars/avatar_24.jpg',
            firstName: parsed.user.firstName || '',
            lastName: parsed.user.lastName || '',
            phone: parsed.user.phone || '',
            rate: parsed.user.rate || 1,
            avatar: parsed.user.avatar || null,
          } as User;
          
          values = { 
            auth: { 
              user: mappedUser, 
              tokens: parsed.tokens 
            }, 
            isLogged: true 
          };
          
        } else {
          console.log('⚠️ Invalid auth data structure, using initial state');
          values = { auth: initialState, isLogged: false };
        }
      } catch (error) {
        console.error('⚠️ Error parsing auth data:', error);
        window.localStorage.setItem('auth', JSON.stringify(initialState));
        values = { auth: initialState, isLogged: false };
      }
    } else {
      console.log('🔭 No auth data found, using initial state');
      values = { auth: initialState, isLogged: false };
    }

    console.log('🎯 Setting initial auth values:', { 
      hasUser: !!values.auth.user,
      hasTokens: !!values.auth.tokens,
      isLogged: values.isLogged
    });
    
    setValues({ ...values, isReady: true });
    
    // If user is logged in, fetch fresh data after initialization
    if (values.isLogged && values.auth.tokens?.accessToken) {
      console.log('🔄 User is logged in, scheduling fresh data fetch...');
      // Give some time for the app to fully initialize
      setTimeout(() => {
        const currentState = authStore.getState();
        if (currentState.isLogged && currentState.auth.tokens?.accessToken) {
          authStore.getState().fetchFreshUserData();
        }
      }, 2000);
    }
  },

  testTokenStorage: () => {
    console.log('🧪 Testing token storage...');
    if (typeof window === 'undefined') {
      console.log('🧪 Window undefined');
      return;
    }
    
    const authData = window.localStorage.getItem('auth');
    console.log('🧪 Raw localStorage data:', authData ? 'Found' : 'Not found');
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        console.log('🧪 Parsed data structure valid:', !!parsed.tokens);
        console.log('🧪 Access token:', parsed?.tokens?.accessToken ? 'Present' : 'Missing');
        console.log('🧪 Refresh token:', parsed?.tokens?.refreshToken ? 'Present' : 'Missing');
        if (parsed?.tokens?.accessToken) {
          console.log('🧪 Token preview:', parsed.tokens.accessToken.substring(0, 20) + '...');
          console.log('🧪 Token length:', parsed.tokens.accessToken.length);
        }
      } catch (error) {
        console.error('🧪 Error parsing auth data:', error);
      }
    }
  },

  refreshAuthState: () => {
    console.log('🔄 Refreshing auth state...');
    if (typeof window === 'undefined') return;
    
    const authData = window.localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.user && parsed.tokens && parsed.tokens.accessToken) {
          console.log('🔄 Found valid auth data, updating store...');
          setValues({
            auth: parsed,
            isLogged: true,
            isReady: true
          });
          console.log('🔄 Auth state refreshed successfully');
        } else {
          console.log('🔄 Invalid auth data structure');
        }
      } catch (error) {
        console.error('🔄 Error refreshing auth state:', error);
      }
    } else {
      console.log('🔄 No auth data found in localStorage');
    }
  },

  fetchFreshUserData: async () => {
    console.log('🔄 Fetching fresh user data from backend...');
    
    try {
      const currentState = authStore.getState();
      
      if (!currentState.auth.tokens?.accessToken) {
        console.log('⚠️ No access token available, cannot fetch user data');
        return;
      }

      console.log('🌐 Making API call to get current user...');
      
      // Dynamic import to avoid circular dependency
      const { UserAPI } = await import('@/app/api/users');
      const response = await UserAPI.getMe();
      
      console.log('📦 Response received:', response);
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response keys:', response ? Object.keys(response) : 'null/undefined');
      
      // Handle different response formats from your backend
      let userData = null;
      
      if (response && response.success && response.data) {
        // New format: { success: true, data: user, message: "..." }
        console.log('✅ Fresh user data received (new format):', response.data);
        userData = response.data;
      } else if (response && (response as any)._id) {
        // Old format: direct user object
        console.log('✅ Fresh user data received (old format):', response);
        userData = response as any;
      } else if (!response || (response && Object.keys(response).length === 0)) {
        // 304 Not Modified response (empty response body)
        console.log('✅ User data is not modified (304), using cached data.');
        console.log('🎉 User data refresh successful (no changes)!');
        return;
      } else {
        console.log('ℹ️ Unexpected response format:', response);
        console.log('🎉 User data refresh completed (keeping current data)!');
        return;
      }
      
      if (userData) {
        const updatedAuth = {
          user: userData,
          tokens: currentState.auth.tokens
        };
        
        console.log('💾 Updating auth store with fresh user data...');
        authStore.getState().set(updatedAuth);
        
        console.log('🎉 User data successfully refreshed from backend!');
      }
    } catch (error: any) {
      console.error('❌ Error fetching fresh user data:', error);
      
      if (error?.response?.status === 401) {
        console.log('🔒 Token expired or unauthorized, clearing auth...');
        authStore.getState().logout();
        
        if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
          setTimeout(() => {
            window.location.href = '/auth/signin';
          }, 100);
        }
      }
    }
  },
}));