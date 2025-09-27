import { authStore } from '@/contexts/authStore';
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    console.log('🎣 useAuth hook mounting...');
    
    const unsubscribe = authStore.subscribe((newState) => {
      console.log('🔄 Auth store state changed in useAuth:', {
        isReady: newState.isReady,
        isLogged: newState.isLogged,
        hasUser: !!newState.auth?.user,
        hasTokens: !!newState.auth?.tokens,
        hasAccessToken: !!newState.auth?.tokens?.accessToken
      });
      setState(newState);
    });

    // Ensure auth is initialized
    if (!state.isReady) {
      console.log('🔄 Auth not ready, initializing...');
      authStore.getState().initializeAuth();
    }

    return () => {
      console.log('🎣 useAuth hook unmounting...');
      unsubscribe();
    };
  }, []);

  // Debug function to test auth state
  const debugAuth = () => {
    console.log('🐛 === AUTH DEBUG INFO ===');
    console.log('🐛 Current state:', {
      isReady: state.isReady,
      isLogged: state.isLogged,
      hasUser: !!state.auth?.user,
      hasTokens: !!state.auth?.tokens,
      hasAccessToken: !!state.auth?.tokens?.accessToken,
      userFirstName: state.auth?.user?.firstName,
      tokenLength: state.auth?.tokens?.accessToken?.length
    });
    
    // Test token storage
    authStore.getState().testTokenStorage();
    
    return state;
  };

  return {
    auth: state.auth,
    isLogged: state.isLogged,
    isReady: state.isReady,
    set: state.set,
    clear: state.clear,
    initializeAuth: state.initializeAuth,
    fetchFreshUserData: state.fetchFreshUserData,
    logout: state.logout,
    debugAuth, // Add debug function
  };
};

export default useAuth;