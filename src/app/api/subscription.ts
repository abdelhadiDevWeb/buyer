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

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const SubscriptionAPI = {
  // Get all subscription plans
  getPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    const res = await requests.get('subscription/plans');
    if ('success' in res) {
      return res as ApiResponse<SubscriptionPlan[]>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
      message: (res as any)?.data?.message,
    } as ApiResponse<SubscriptionPlan[]>;
  },
  
  // Get plans by role
  getPlansByRole: async (role: string): Promise<ApiResponse<{ success: boolean; plans: SubscriptionPlan[] }>> => {
    const res = await requests.get(`subscription/plans/${role}?t=${Date.now()}`);
    if ('success' in res) {
      return res as ApiResponse<{ success: boolean; plans: SubscriptionPlan[] }>;
    }
    const data = (res as any)?.data ?? {};
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: {
        success: Boolean(data?.success ?? true),
        plans: data?.plans ?? data?.data ?? [],
      },
      message: data?.message,
    } as ApiResponse<{ success: boolean; plans: SubscriptionPlan[] }>;
  },
  
  // Create a new subscription plan (Admin only)
  createPlan: async (plan: CreatePlanDto): Promise<ApiResponse<SubscriptionPlan>> => {
    const res = await requests.post('subscription/admin/plans', plan);
    if ('success' in res) {
      return res as ApiResponse<SubscriptionPlan>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<SubscriptionPlan>;
  },
  
  // Update an existing subscription plan (Admin only)
  updatePlan: async (planId: string, plan: Partial<CreatePlanDto>): Promise<ApiResponse<SubscriptionPlan>> => {
    const res = await requests.patch(`subscription/admin/plans/${planId}`, plan);
    if ('success' in res) {
      return res as ApiResponse<SubscriptionPlan>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<SubscriptionPlan>;
  },
  
  // Delete a subscription plan (Admin only)
  deletePlan: async (planId: string): Promise<ApiResponse<void>> => {
    const res = await requests.delete(`subscription/admin/plans/${planId}`);
    if ('success' in res) {
      return res as ApiResponse<void>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: undefined as unknown as void,
      message: (res as any)?.data?.message,
    } as ApiResponse<void>;
  },
  
  // Initialize default plans (Admin only)
  initializePlans: async (): Promise<ApiResponse<any>> => {
    const res = await requests.post('subscription/admin/init-plans', {});
    if ('success' in res) {
      return res as ApiResponse<any>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<any>;
  },
  
  // Get subscription statistics (Admin only)
  getStats: async (): Promise<ApiResponse<any>> => {
    const res = await requests.get('subscription/admin/stats');
    if ('success' in res) {
      return res as ApiResponse<any>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<any>;
  },
  
  // Get all subscriptions (Admin only)
  getAllSubscriptions: async (): Promise<ApiResponse<any>> => {
    const res = await requests.get('subscription');
    if ('success' in res) {
      return res as ApiResponse<any>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<any>;
  },
  
  // Get my subscription
  getMySubscription: async (): Promise<ApiResponse<MySubscriptionResponse>> => {
    const res = await requests.get('subscription/my-subscription');
    if ('success' in res) {
      return res as ApiResponse<MySubscriptionResponse>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<MySubscriptionResponse>;
  },
  
  // Create subscription with payment
  createSubscriptionWithPayment: async (data: CreateSubscriptionWithPaymentDto): Promise<ApiResponse<SubscriptionResponse>> => {
    const res = await requests.post('subscription/create-with-payment', data);
    if ('success' in res) {
      return res as ApiResponse<SubscriptionResponse>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<SubscriptionResponse>;
  },
  
  // Confirm payment for subscription
  confirmPayment: async (paymentId: string): Promise<ApiResponse<PaymentConfirmationResponse>> => {
    const res = await requests.post(`subscription/payment/${paymentId}/confirm`, {});
    if ('success' in res) {
      return res as ApiResponse<PaymentConfirmationResponse>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<PaymentConfirmationResponse>;
  },
  
  // Get payment status
  getPaymentStatus: async (paymentId: string): Promise<ApiResponse<PaymentStatusResponse>> => {
    const res = await requests.get(`subscription/payment/${paymentId}/status`);
    if ('success' in res) {
      return res as ApiResponse<PaymentStatusResponse>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<PaymentStatusResponse>;
  },
  
  // Get my payments
  getMyPayments: async (): Promise<ApiResponse<MyPaymentsResponse>> => {
    const res = await requests.get('subscription/my-payments');
    if ('success' in res) {
      return res as ApiResponse<MyPaymentsResponse>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<MyPaymentsResponse>;
  },
  
  // Get all payments (Admin only)
  getAllPayments: async (page?: number, limit?: number): Promise<ApiResponse<any>> => {
    const res = await requests.get(`subscription/admin/payments?page=${page || 1}&limit=${limit || 10}`);
    if ('success' in res) {
      return res as ApiResponse<any>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<any>;
  },
  
  // Cleanup expired subscriptions and payments (Admin only)
  cleanupExpired: async (): Promise<ApiResponse<any>> => {
    const res = await requests.post('subscription/admin/cleanup-expired', {});
    if ('success' in res) {
      return res as ApiResponse<any>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<any>;
  },
  
  // Handle SlickPay webhook (Public)
  handleSlickPayWebhook: async (payload: any): Promise<ApiResponse<{ success: boolean; error?: string }>> => {
    const res = await requests.post('subscription/webhook/slickpay', payload);
    if ('success' in res) {
      return res as ApiResponse<{ success: boolean; error?: string }>;
    }
    const data = (res as any)?.data ?? {};
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: { success: Boolean(data?.success ?? true), error: data?.error },
      message: data?.message,
    } as ApiResponse<{ success: boolean; error?: string }>;
  },
  
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