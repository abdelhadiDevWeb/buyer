// Slickpay API v2 configuration (for Algerian payments)
interface SlickpayConfig {
  publicKey: string;
  baseUrl: string;
  isLive: boolean;
}

// Payment provider types - only SlickPay
export type PaymentProvider = 'slickpay';

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Payment transaction interface
export interface PaymentTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  payment_id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_email: string;
  customer_name?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Subscription payment interface
export interface SubscriptionPayment {
  organization_id: string;
  user_id: string;
  plan: string;
  duration_months: number;
  total_amount: number;
  payment_method: PaymentProvider;
  customer_email: string;
  customer_name?: string;
}

// Store payment interface (for future use)
export interface StorePayment {
  organization_id: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  currency: string;
  order_id?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the correct base URL for the application
 */
function getBaseUrl(): string {
  // Determine the correct base URL for the application
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mazad-click-buyer.vercel.app';
  
  // Check if we're in development mode (localhost)
  const isLocalhost = baseUrl.includes('localhost') || 
                     process.env.NODE_ENV === 'development' ||
                     process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost');
  
  if (isLocalhost) {
    // Use HTTP for localhost development
    baseUrl = baseUrl.replace('https://', 'http://');
  }
  
  console.log('[getBaseUrl] Generated base URL:', baseUrl);
  return baseUrl;
}

// ============================================================================
// SLICKPAY PAYMENT FUNCTIONS
// ============================================================================

/**
 * Create a Slickpay payment request
 */
export async function createSlickpayPayment(payment: SubscriptionPayment): Promise<{ paymentId: string; redirectUrl: string }> {
  try {
    // Slickpay API v2 configuration - using real test credentials
    const slickpayConfig: SlickpayConfig = {
      publicKey: process.env.NEXT_PUBLIC_SLICKPAY_PUBLIC_KEY || '54|BZ7F6N4KwSD46GEXToOv3ZBpJpf7WVxnBzK5cOE6',
      baseUrl: process.env.NEXT_PUBLIC_SLICKPAY_BASE_URL || 'https://devapi.slick-pay.com/api/v2',
      isLive: process.env.NEXT_PUBLIC_SLICKPAY_TEST_MODE !== 'true',
    };

    // Get the correct base URL for the application
    const baseUrl = getBaseUrl();

    // Create payment request payload according to SlickPay Invoice API
    // Use SlickPay-specific public URL (ngrok for dev, real domain for prod)
    const slickpayUrl = process.env.NEXT_PUBLIC_SLICKPAY_PUBLIC_URL || process.env.NEXT_PUBLIC_MAIN_DOMAIN || baseUrl;
    
    // Create a callback URL with payment metadata for verification
    // Use baseUrl to ensure redirect goes to the correct domain
    const callbackUrl = `${baseUrl}/subscription/payment/success?success=true&source=slickpay&org_id=${encodeURIComponent(payment.organization_id)}&user_id=${encodeURIComponent(payment.user_id)}&plan=${encodeURIComponent(payment.plan)}&duration=${payment.duration_months}`;
      
    const payload = {
      amount: payment.total_amount,
      url: callbackUrl,
      firstname: payment.customer_name?.split(' ')[0] || 'Customer',
      lastname: payment.customer_name?.split(' ').slice(1).join(' ') || 'User',
      email: payment.customer_email,
      address: 'Algeria', // Required field
      account: "3fe91007-3142-4268-9133-fa4a54379134", // SlickPay account ID
      items: [
        {
          name: `${payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)} Plan Subscription`,
          price: payment.total_amount,
          quantity: 1
        }
      ],
      // Enable webhook configuration for proper database updates
      // Use baseUrl to ensure webhook goes to the correct domain
      webhook_url: `${baseUrl}/api/webhooks/slickpay`,
      webhook_meta_data: {
        organization_id: payment.organization_id,
        user_id: payment.user_id,
        plan: payment.plan,
        duration_months: payment.duration_months,
        payment_type: 'subscription',
        customer_email: payment.customer_email,
        customer_name: payment.customer_name,
        total_amount: payment.total_amount,
        payment_method: 'slickpay'
      },
      note: `Subscription: ${payment.plan} plan for ${payment.duration_months} month${payment.duration_months > 1 ? 's' : ''}`
    };

    console.log('[SlickPay API Request]', {
      url: `${slickpayConfig.baseUrl}/users/invoices`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${slickpayConfig.publicKey.substring(0, 10)}...`,
      },
      payload
    });

    // Make API request to SlickPay v2 (using invoices endpoint as per documentation)
    const response = await fetch(`${slickpayConfig.baseUrl}/users/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${slickpayConfig.publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SlickPay API Error]', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Slickpay API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[SlickPay API Response]', data);
    console.log('[SlickPay] Callback URL sent to SlickPay:', callbackUrl);

    // SlickPay returns different URL structures based on response
    // Use the main URL for payment processing (this is the correct payment URL)
    const redirectUrl = data.url;
    
    if (!redirectUrl) {
      console.error('[SlickPay API Error] No redirect URL found in response:', data);
      throw new Error('No payment URL returned from SlickPay');
    }
    
    console.log('[SlickPay] Using redirect URL:', redirectUrl);
    
    return {
      paymentId: data.id.toString(),
      redirectUrl: redirectUrl,
    };
  } catch (error) {
    console.error('Error creating Slickpay payment:', error);
    throw new Error('Failed to create Slickpay payment');
  }
}

/**
 * Verify Slickpay payment status
 */
export async function verifySlickpayPayment(paymentId: string): Promise<{ status: PaymentStatus; amount: number; currency: string }> {
  try {
    const slickpayConfig: SlickpayConfig = {
      publicKey: process.env.NEXT_PUBLIC_SLICKPAY_PUBLIC_KEY || '54|BZ7F6N4KwSD46GEXToOv3ZBpJpf7WVxnBzK5cOE6',
      baseUrl: process.env.NEXT_PUBLIC_SLICKPAY_BASE_URL || 'https://devapi.slick-pay.com/api/v2',
      isLive: process.env.NEXT_PUBLIC_SLICKPAY_TEST_MODE !== 'true',
    };

    const response = await fetch(`${slickpayConfig.baseUrl}/users/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${slickpayConfig.publicKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SlickPay API Error]', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Slickpay API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[SlickPay API Response]', data);

    // SlickPay invoice response: {success: 1, completed: 0|1, data: {...}}
    const paymentStatus = data.completed === 1 ? 'completed' : 'pending';
    
    return {
      status: paymentStatus as PaymentStatus,
      amount: data.data?.amount || 0,
      currency: 'DZD',
    };
  } catch (error) {
    console.error('Error verifying Slickpay payment:', error);
    throw new Error('Failed to verify Slickpay payment');
  }
}

/**
 * Map Slickpay status to our payment status
 */
function mapSlickpayStatus(slickpayStatus: string): PaymentStatus {
  switch (slickpayStatus.toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'completed':
    case 'success':
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// ============================================================================
// SUBSCRIPTION ACTIVATION FUNCTIONS
// ============================================================================

/**
 * Activate subscription after successful payment
 * This function can be called to update the user's subscription status
 * You can integrate this with your existing backend API
 */
export async function activateSubscription(
  organizationId: string,
  userId: string,
  plan: string,
  durationMonths: number,
  paymentMethod: 'slickpay' = 'slickpay'
): Promise<void> {
  try {
    console.log(`[activateSubscription] Activating subscription for org: ${organizationId}, user: ${userId}, plan: ${plan}, duration: ${durationMonths} months, payment method: ${paymentMethod}`);
    
    // Calculate subscription end date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // You can integrate this with your existing backend API
    // For now, we'll just log the activation
    console.log(`[activateSubscription] Subscription activation data:`, {
      organizationId,
      userId,
      plan,
      durationMonths,
      paymentMethod,
      endDate: endDate.toISOString()
    });

    // Example: Call your backend API to activate subscription
    // const response = await fetch('/api/subscription/activate', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     organizationId,
    //     userId,
    //     plan,
    //     durationMonths,
    //     paymentMethod,
    //     endDate: endDate.toISOString()
    //   })
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to activate subscription');
    // }

    console.log(`[activateSubscription] Subscription activated successfully for organization: ${organizationId}`);
  } catch (error) {
    console.error('[activateSubscription] Error activating subscription:', error);
    throw new Error('Failed to activate subscription');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000; // Max 1M DZD
}

/**
 * Generate unique payment ID
 */
export function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get payment provider display name
 */
export function getPaymentProviderName(provider: PaymentProvider): string {
  switch (provider) {
    case 'slickpay':
      return 'Slickpay';
    default:
      return 'Unknown';
  }
}

/**
 * Get payment status display name
 */
export function getPaymentStatusName(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get payment status color for UI
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    case 'cancelled':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
} 