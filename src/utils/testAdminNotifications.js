// Test utility for admin message notifications
import { authStore } from '@/contexts/authStore';

export const testAdminNotificationsState = () => {
  const state = authStore.getState();
  
  console.log('=== Admin Notifications State Test ===');
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

export const testAdminNotificationsHook = async () => {
  try {
    // Dynamically import the hook to test it
    const { useAdminMessageNotifications } = await import('@/hooks/useAdminMessageNotifications');
    console.log('✅ Admin notifications hook imported successfully');
    
    // Note: We can't actually call the hook here since it needs to be called inside a React component
    // But we can verify the import works
    return true;
  } catch (error) {
    console.error('❌ Error importing admin notifications hook:', error);
    return false;
  }
};
