// Test utility for authentication state
import { authStore } from '@/contexts/authStore';

export const testAuthState = () => {
  const state = authStore.getState();
  
  console.log('=== Auth State Test ===');
  console.log('isReady:', state.isReady);
  console.log('isLogged:', state.isLogged);
  console.log('auth.user:', state.auth.user);
  console.log('auth.tokens:', state.auth.tokens ? 'Present' : 'Missing');
  
  if (state.auth.user) {
    console.log('User ID:', state.auth.user._id);
    console.log('User email:', state.auth.user.email);
  }
  
  return {
    isReady: state.isReady,
    isLogged: state.isLogged,
    hasUser: !!state.auth.user,
    hasTokens: !!state.auth.tokens,
    userId: state.auth.user?._id
  };
};

export const testLocalStorage = () => {
  if (typeof window === 'undefined') {
    console.log('Window not available (server-side)');
    return null;
  }
  
  const authData = window.localStorage.getItem('auth');
  console.log('=== LocalStorage Test ===');
  console.log('Raw auth data:', authData);
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      console.log('Parsed auth data:', parsed);
      console.log('User ID in localStorage:', parsed.user?._id);
      return parsed;
    } catch (error) {
      console.error('Error parsing localStorage auth data:', error);
      return null;
    }
  }
  
  return null;
};
