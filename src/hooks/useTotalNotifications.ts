import { useState, useEffect } from 'react';
import useNotification from './useNotification';
import { useAdminMessageNotifications } from './useAdminMessageNotifications';

export default function useTotalNotifications() {
  const { unreadCount: generalUnreadCount, refresh: refreshGeneral } = useNotification();
  const { unreadAdminMessagesCount: adminUnreadCount, refreshNotifications: refreshAdmin } = useAdminMessageNotifications();
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate total unread count whenever any count changes
  useEffect(() => {
    const total = (generalUnreadCount || 0) + (adminUnreadCount || 0);
    console.log('📊 Combined notification counts:', {
      generalUnreadCount,
      adminUnreadCount,
      total
    });
    setTotalUnreadCount(total);
    setIsLoading(false);
  }, [generalUnreadCount, adminUnreadCount]);

  // Refresh all notification counts
  const refreshAll = async () => {
    console.log('🔄 Refreshing all notification counts');
    setIsLoading(true);
    try {
      await Promise.all([
        refreshGeneral(),
        refreshAdmin()
      ]);
      console.log('✅ All notification counts refreshed');
    } catch (error) {
      console.error('❌ Error refreshing notification counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    totalUnreadCount,
    generalUnreadCount,
    adminUnreadCount,
    isLoading,
    refreshAll
  };
}
