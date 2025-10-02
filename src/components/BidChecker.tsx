"use client";

import { useEffect } from 'react';
import { authStore } from '@/contexts/authStore';
import { BidsCheck } from '@/app/api/checkBids';

export default function BidChecker() {
  const { auth, isLogged } = authStore();

  useEffect(() => {
    if (!isLogged || !auth?.user) return;

    // checkBids function
    async function checkBids() {
      if (!auth || !auth.user) return;
      try {
        const res = await BidsCheck.checkBids({ id: String(auth.user._id || '') });
        console.log('Res Bid Check', res);
      } catch (error) {
        console.error('Error checking bids:', error);
      }
    }

    // Set up interval to check bids every 5 seconds
    const interval = setInterval(() => {
      checkBids();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [auth, isLogged]);

  return null; // This component doesn't render anything
}
