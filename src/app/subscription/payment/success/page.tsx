"use client";

import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import { CheckCircle, Error, Pending } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  verifySlickpayPayment, 
  activateSubscription,
  formatCurrency,
  getPaymentStatusName,
  getPaymentStatusColor 
} from '@/app/api/payment';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get URL parameters
        const success = searchParams.get('success');
        const source = searchParams.get('source');
        const paymentId = searchParams.get('payment_id');
        const orgId = searchParams.get('org_id');
        const userId = searchParams.get('user_id');
        const plan = searchParams.get('plan');
        const duration = searchParams.get('duration');

        console.log('Payment success page parameters:', {
          success,
          source,
          paymentId,
          orgId,
          userId,
          plan,
          duration
        });

        // Get stored payment data
        const storedPayment = localStorage.getItem('pendingPayment');
        if (storedPayment) {
          const parsedPayment = JSON.parse(storedPayment);
          setPaymentData(parsedPayment);
        }

        // Check if payment was successful
        if (success === 'true' && source === 'slickpay' && paymentId) {
          console.log('Verifying SlickPay payment:', paymentId);

          // Verify payment with SlickPay
          const verificationResult = await verifySlickpayPayment(paymentId);
          console.log('Payment verification result:', verificationResult);

          if (verificationResult.status === 'completed') {
            setPaymentStatus('completed');

            // Activate subscription if we have the required data
            if (orgId && userId && plan && duration) {
              try {
                await activateSubscription(
                  orgId,
                  userId,
                  plan,
                  parseInt(duration),
                  'slickpay'
                );
                console.log('Subscription activated successfully');
              } catch (activationError) {
                console.error('Failed to activate subscription:', activationError);
                // Don't fail the whole process if activation fails
              }
            }

            // Clear stored payment data
            localStorage.removeItem('pendingPayment');
          } else if (verificationResult.status === 'failed') {
            setPaymentStatus('failed');
            setError('Payment verification failed');
          } else {
            setPaymentStatus('pending');
            setError('Payment is still being processed');
          }
        } else {
          setPaymentStatus('failed');
          setError('Invalid payment response');
        }
      } catch (error: any) {
        console.error('Error handling payment success:', error);
        setPaymentStatus('failed');
        setError(error.message || 'Failed to verify payment');
      } finally {
        setIsLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />;
      case 'failed':
        return <Error sx={{ fontSize: 60, color: 'error.main' }} />;
      default:
        return <Pending sx={{ fontSize: 60, color: 'warning.main' }} />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment Processing';
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Your payment has been processed successfully. Your subscription is now active.';
      case 'failed':
        return 'There was an issue processing your payment. Please try again or contact support.';
      default:
        return 'Your payment is being processed. This may take a few minutes.';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="h5">Verifying Payment...</Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we verify your payment with SlickPay.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {/* Status Icon */}
          <Box sx={{ mb: 3 }}>
            {getStatusIcon()}
          </Box>

          {/* Status Message */}
          <Typography variant="h4" component="h1" gutterBottom>
            {getStatusMessage()}
          </Typography>

          {/* Status Description */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {getStatusDescription()}
          </Typography>

          {/* Payment Details */}
          {paymentData && (
            <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Plan:</Typography>
                <Typography fontWeight="bold">{paymentData.planName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Amount:</Typography>
                <Typography fontWeight="bold">
                  {formatCurrency(paymentData.amount, paymentData.currency)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Status:</Typography>
                <Chip 
                  label={getPaymentStatusName(paymentData.status)} 
                  color={paymentStatus === 'completed' ? 'success' : paymentStatus === 'failed' ? 'error' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {paymentStatus === 'completed' ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/profile')}
                sx={{ px: 4 }}
              >
                Go to Profile
              </Button>
            ) : paymentStatus === 'failed' ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/subscription-plans')}
                sx={{ px: 4 }}
              >
                Try Again
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.location.reload()}
                sx={{ px: 4 }}
              >
                Refresh Status
              </Button>
            )}
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/')}
              sx={{ px: 4 }}
            >
              Go Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
} 