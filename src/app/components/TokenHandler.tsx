'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStore } from '@/contexts/authStore';
import app from '@/config';

interface TokenHandlerProps {
  children: React.ReactNode;
}

export default function TokenHandler({ children }: TokenHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const processTokenFromUrl = async () => {
      // Only process once
      if (hasProcessed || isProcessing) return;

      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const fromSeller = searchParams.get('from') === 'seller';

      // Only process if we have a token and it's from seller
      if (token && fromSeller) {
        console.log('🔄 TokenHandler: Processing token from seller redirect');
        setIsProcessing(true);

        try {
          // Decode the tokens
          const accessToken = decodeURIComponent(token);
          const refreshTokenValue = refreshToken ? decodeURIComponent(refreshToken) : '';

          console.log('🔑 TokenHandler: Extracted tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshTokenValue,
            accessTokenLength: accessToken.length
          });

          // Verify the token with the backend
          const response = await fetch(`${app.baseURL.replace(/\/$/, '')}/auth/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'x-access-key': app.apiKey,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ TokenHandler: Token validation successful:', data);

            if (data.valid && data.user) {
              // Store the authentication data
              const authData = {
                user: data.user,
                tokens: {
                  accessToken: accessToken,
                  refreshToken: refreshTokenValue,
                },
              };

              console.log('💾 TokenHandler: Storing auth data:', authData);
              authStore.getState().set(authData);

              // Remove token parameters from URL without page reload
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              url.searchParams.delete('refreshToken');
              url.searchParams.delete('from');
              
              // Update URL without reload
              window.history.replaceState({}, '', url.toString());

              console.log('🎉 TokenHandler: Authentication successful, redirecting to home');
              
              // Small delay to ensure auth store is updated
              setTimeout(() => {
                router.push('/');
              }, 500);
            } else {
              console.error('❌ TokenHandler: Invalid token response:', data);
              // Clean up URL parameters
              const url = new URL(window.location.href);
              url.searchParams.delete('token');
              url.searchParams.delete('refreshToken');
              url.searchParams.delete('from');
              window.history.replaceState({}, '', url.toString());
            }
          } else {
            console.error('❌ TokenHandler: Token validation failed:', response.status);
            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refreshToken');
            url.searchParams.delete('from');
            window.history.replaceState({}, '', url.toString());
          }
        } catch (error) {
          console.error('❌ TokenHandler: Error processing token:', error);
          // Clean up URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('refreshToken');
          url.searchParams.delete('from');
          window.history.replaceState({}, '', url.toString());
        } finally {
          setIsProcessing(false);
          setHasProcessed(true);
        }
      } else {
        // No token to process
        setHasProcessed(true);
      }
    };

    processTokenFromUrl();
  }, [searchParams, router, hasProcessed, isProcessing]);

  // Show loading state while processing token
  if (isProcessing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Authenticating...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
