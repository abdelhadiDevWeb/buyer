"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { 
  createSlickpayPayment, 
  SubscriptionPayment, 
  formatCurrency,
  validatePaymentAmount 
} from '@/app/api/payment';

interface PaymentFormProps {
  plan: {
    id: string;
    name: string;
    price: number;
    duration_months: number;
  };
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  organizationId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({ 
  plan, 
  user, 
  organizationId, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!validatePaymentAmount(plan.price)) {
      setError('Invalid payment amount');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create subscription payment data
      const paymentData: SubscriptionPayment = {
        organization_id: organizationId,
        user_id: user.id,
        plan: plan.name,
        duration_months: plan.duration_months,
        total_amount: plan.price,
        payment_method: 'slickpay',
        customer_email: user.email,
        customer_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      };

      console.log('Creating SlickPay payment with data:', paymentData);

      // Create payment using SlickPay
      const result = await createSlickpayPayment(paymentData);

      console.log('SlickPay payment created successfully:', result);

      // Store payment info for reference
      localStorage.setItem('pendingPayment', JSON.stringify({
        paymentId: result.paymentId,
        planName: plan.name,
        amount: plan.price,
        currency: 'DZD',
        status: 'pending',
        paymentMethod: 'slickpay',
        timestamp: new Date().toISOString()
      }));

      // Redirect to SlickPay payment page
      window.location.href = result.redirectUrl;

    } catch (error: any) {
      console.error('Payment creation failed:', error);
      const errorMessage = error.message || 'Failed to create payment';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Complete Your Payment
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Plan Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Plan Details
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Plan:</Typography>
            <Typography fontWeight="bold">{plan.name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Duration:</Typography>
            <Typography>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Amount:</Typography>
            <Typography fontWeight="bold" color="primary">
              {formatCurrency(plan.price, 'DZD')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Payment Method */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Method
          </Typography>
          <Chip 
            label="SlickPay - Secure Algerian Payment Gateway" 
            color="primary" 
            variant="outlined"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            You will be redirected to SlickPay's secure payment page to complete your transaction.
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Payment Button */}
        <LoadingButton
          fullWidth
          variant="contained"
          size="large"
          loading={isProcessing}
          onClick={handlePayment}
          disabled={isProcessing}
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          {isProcessing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Processing Payment...
            </>
          ) : (
            `Pay ${formatCurrency(plan.price, 'DZD')}`
          )}
        </LoadingButton>

        {/* Security Notice */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          🔒 Your payment information is secure and encrypted
        </Typography>
      </CardContent>
    </Card>
  );
} 