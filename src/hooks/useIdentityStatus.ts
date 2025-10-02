import { useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import { IdentityAPI } from '@/app/api/identity';

export const useIdentityStatus = () => {
  const { isLogged } = useAuth();
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  type Identity = { status?: string } & Record<string, unknown>;
  const [identityData, setIdentityData] = useState<Identity | null>(null);

  const checkIdentityStatus = useCallback(async () => {
    if (!isLogged) {
      setIsLoading(false);
      setIdentityStatus(null);
      setIdentityData(null);
      return;
    }

    try {
      setIsLoading(true);
      const identity = await IdentityAPI.getMyIdentity();
      
      if (identity && identity.success && identity.data) {
        setIdentityData(identity.data as any);
        setIdentityStatus((identity.data as any).status);
        console.log('✅ Identity status fetched:', identity.data.status);
      } else {
        console.log('⚠️ No identity found or invalid response');
        setIdentityStatus(null);
        setIdentityData(null);
      }
    } catch (error: any) {
      console.error('❌ Error checking identity status:', error);
      setIdentityStatus(null);
      setIdentityData(null);
      
      // If it's a 404, it means no identity exists
      if (error?.response?.status === 404) {
        console.log('📭 No identity found for user (404)');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLogged]);

  useEffect(() => {
    checkIdentityStatus();
  }, [checkIdentityStatus]);

  return {
    identityStatus,
    isLoading,
    identityData,
    checkIdentityStatus,
    // Helper methods
    hasIdentity: !!identityData,
    isIdentityPending: identityStatus === 'PENDING',
    isIdentityApproved: identityStatus === 'APPROVED',
    isIdentityRejected: identityStatus === 'REJECTED',
  };
};