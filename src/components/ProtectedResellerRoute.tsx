"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIdentityStatus } from '@/hooks/useIdentityStatus';

interface ProtectedResellerRouteProps {
  children: React.ReactNode;
}

export default function ProtectedResellerRoute({ children }: ProtectedResellerRouteProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { identityStatus, isLoading } = useIdentityStatus();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoading && identityStatus) {
      let redirectMessage = '';
      
      switch (identityStatus) {
        case 'DONE':
          redirectMessage = t('protectedReseller.alreadyVerified');
          break;
        case 'WAITING':
          redirectMessage = t('protectedReseller.underReview');
          break;
        case 'REJECTED':
          redirectMessage = t('protectedReseller.applicationRejected');
          break;
        default:
          redirectMessage = t('protectedReseller.unknownStatus');
      }
      
      setMessage(redirectMessage);
      
      // Redirect after showing message
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    }
  }, [identityStatus, isLoading, router, t]);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            background: 'white',
            padding: '3rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px'
          }}
        >
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            color: '#0063b1'
          }}>
            ⏳
          </div>
          <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>
            {t('protectedReseller.loading')}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {t('protectedReseller.checkingStatus')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Show redirect message if user has identity
  if (identityStatus) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            background: 'white',
            padding: '3rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px'
          }}
        >
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            color: '#f59e0b'
          }}>
            ⚠️
          </div>
          <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>
            {t('protectedReseller.accessRestricted')}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {message}
          </p>
          <button
            onClick={() => router.push('/profile')}
            style={{
              background: '#0063b1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#0056a3';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#0063b1';
            }}
          >
            {t('protectedReseller.goToProfile')}
          </button>
        </motion.div>
      </div>
    );
  }

  // Show children if no identity status (user can apply)
  return <>{children}</>;
} 