import { requests } from './utils';

export interface SubscriptionPlan {
  _id?: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months (stored as number, not Date)
  isActive: boolean;
  role: string; // PROFESSIONAL or RESELLER
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDto {
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive?: boolean;
  role: string;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {
  _id: string;
}

export interface CreateSubscriptionWithPaymentDto {
  plan: string;
  returnUrl?: string;
  paymentMethod?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscription: any;
  payment: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    subscriptionPlan: string;
    completedAt?: string;
    expiresAt?: string;
  };
}

export interface PaymentConfirmationResponse {
  success: boolean;
  message: string;
  subscription: any;
  payment: any;
}

export interface MySubscriptionResponse {
  success: boolean;
  message?: string;
  subscription: any;
  hasActiveSubscription: boolean;
  allSubscriptions: Array<{
    id: string;
    planId: string;
    planName: string;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface MyPaymentsResponse {
  success: boolean;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
    completedAt?: string;
    expiresAt?: string;
  }>;
}

export const SubscriptionAPI = {
  // Get all subscription plans
  getPlans: (): Promise<SubscriptionPlan[]> =>
    requests.get('subscription/plans') as any,
  
  // Get plans by role
  getPlansByRole: (role: string): Promise<{ success: boolean; plans: SubscriptionPlan[] }> => 
    requests.get(`subscription/plans/${role}?t=${Date.now()}`) as any,
  
  // Create a new subscription plan (Admin only)
  createPlan: (plan: CreatePlanDto): Promise<SubscriptionPlan> => 
    requests.post('subscription/admin/plans', plan) as any,
  
  // Update an existing subscription plan (Admin only)
  updatePlan: (planId: string, plan: Partial<CreatePlanDto>): Promise<SubscriptionPlan> => 
    requests.patch(`subscription/admin/plans/${planId}`, plan) as any,
  
  // Delete a subscription plan (Admin only)
  deletePlan: (planId: string): Promise<void> => 
    requests.delete(`subscription/admin/plans/${planId}`) as any,
  
  // Initialize default plans (Admin only)
  initializePlans: (): Promise<any> => 
    requests.post('subscription/admin/init-plans', {}) as any,
  
  // Get subscription statistics (Admin only)
  getStats: (): Promise<any> => 
    requests.get('subscription/admin/stats') as any,
  
  // Get all subscriptions (Admin only)
  getAllSubscriptions: (): Promise<any> => 
    requests.get('subscription') as any,
  
  // Get my subscription
  getMySubscription: (): Promise<MySubscriptionResponse> =>
    requests.get('subscription/my-subscription') as any,
  
  // Create subscription with payment
  createSubscriptionWithPayment: (data: CreateSubscriptionWithPaymentDto): Promise<SubscriptionResponse> => 
    requests.post('subscription/create-with-payment', data) as any,
  
  // Confirm payment for subscription
  confirmPayment: (paymentId: string): Promise<PaymentConfirmationResponse> =>
    requests.post(`subscription/payment/${paymentId}/confirm`, {}) as any,
  
  // Get payment status
  getPaymentStatus: (paymentId: string): Promise<PaymentStatusResponse> =>
    requests.get(`subscription/payment/${paymentId}/status`) as any,
  
  // Get my payments
  getMyPayments: (): Promise<MyPaymentsResponse> =>
    requests.get('subscription/my-payments') as any,
  
  // Get all payments (Admin only)
  getAllPayments: (page?: number, limit?: number): Promise<any> => 
    requests.get(`subscription/admin/payments?page=${page || 1}&limit=${limit || 10}`) as any,
  
  // Cleanup expired subscriptions and payments (Admin only)
  cleanupExpired: (): Promise<any> => 
    requests.post('subscription/admin/cleanup-expired', {}) as any,
  
  // Handle SlickPay webhook (Public)
  handleSlickPayWebhook: (payload: any): Promise<{ success: boolean; error?: string }> =>
    requests.post('subscription/webhook/slickpay', payload) as any,
  
  // Payment flow endpoints
  
  // Show mock SATIM form (Development/Testing)
  getMockSatimForm: (mdOrder: string): string =>
    `subscription/payment/mock-satim-form/${mdOrder}`,
  
  // Process mock SATIM payment (Development/Testing)
  processMockSatimPayment: (data: {
    mdOrder: string;
    paymentType: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardName: string;
  }): Promise<any> =>
    requests.post('subscription/payment/mock-satim-process', data),
  
  // Handle mock SATIM payment (Development/Testing)
  handleMockSatimPayment: (paymentMethod: string, mdOrder: string): string =>
    `subscription/payment/mock-satim/${paymentMethod}/${mdOrder}`,
  
  // Handle SlickPay payment return
  handlePaymentReturn: (paymentId: string): string =>
    `subscription/payment/return?paymentId=${paymentId}`,
  
  // Handle payment failure
  handlePaymentFailure: (paymentId: string): string =>
    `subscription/payment/fail?paymentId=${paymentId}`,
};