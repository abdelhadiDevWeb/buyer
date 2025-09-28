"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";

import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import RequestProvider from '@/contexts/RequestContext';
import { motion } from "framer-motion";
import './styles.css';
import { UserAPI } from '@/app/api/users';
import app from '@/config';
import { IdentityAPI } from '@/app/api/identity';
import { SubscriptionAPI, SubscriptionPlan } from '@/app/api/subscription';
import ProtectedResellerRoute from '@/components/ProtectedResellerRoute';
import { useRouter } from 'next/navigation';
import User from '@/types/User';
import { extractErrorMessage } from '@/types/Error';
import { authStore } from '@/contexts/authStore';

interface AuthUserExtended extends User {
  idCardBonusApplied?: boolean; 
  subscriptionBonusApplied?: boolean; 
  combinedBonusApplied?: boolean; 
}

interface AvatarData {
  url?: string;
}

interface ConversionResponse {
  success?: boolean;
  message?: string;
  userTypeChanged?: boolean;
  user?: unknown;
  rateUpdated?: boolean;
  oldRate?: number;
  newRate?: number;
}

export default function BecomeResellerPage() {
  const t = (key: string) => key;
  const { auth, isLogged, isReady, set, initializeAuth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [resellerStep, setResellerStep] = useState(1);
  const [resellerIdCard, setResellerIdCard] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPlanData, setSelectedPlanData] = useState<SubscriptionPlan | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdSubscriptionId, setCreatedSubscriptionId] = useState<string>('');
  const [createdPaymentId, setCreatedPaymentId] = useState<string>('');
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const resellerIdCardRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Initializing auth on component mount...');
    initializeAuth();
    
    setTimeout(() => {
      const authState = authStore.getState();
      console.log('Auth state after initialization:', {
        isReady: authState.isReady,
        isLogged: authState.isLogged,
        hasTokens: !!authState.auth?.tokens,
        hasAccessToken: !!authState.auth?.tokens?.accessToken
      });
      
      const localStorageAuth = localStorage.getItem('auth');
      console.log('localStorage auth data:', localStorageAuth);
      if (localStorageAuth) {
        try {
          const parsed = JSON.parse(localStorageAuth);
          console.log('Parsed localStorage auth:', parsed);
          console.log('Tokens in localStorage:', parsed?.tokens);
        } catch (error) {
          console.error('Error parsing localStorage auth:', error);
        }
      }
    }, 100);
  }, [initializeAuth]);

  // Fetch subscription plans
  const fetchSubscriptionPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      console.log('Fetching subscription plans...');
      const response = await SubscriptionAPI.getPlansByRole('RESELLER');
      
      console.log('Raw API response:', response);
      console.log('Response success:', response.success);
      console.log('Response plans:', response.plans);
      console.log('Plans array length:', response.plans?.length);
      
      if (response.success && response.plans && Array.isArray(response.plans)) {
        // Backend already filters for active plans, so no need to filter again
        const plans = response.plans;
        setSubscriptionPlans(plans);
        console.log('Subscription plans fetched successfully:', plans);
        console.log('Number of plans loaded:', plans.length);
        
        if (plans.length === 0) {
          console.warn('No RESELLER subscription plans found in database');
          enqueueSnackbar('No reseller subscription plans are currently available', { variant: 'info' });
        }
      } else {
        console.warn('No subscription plans found or invalid response');
        console.warn('Response structure:', {
          hasSuccess: 'success' in response,
          successValue: response.success,
          hasPlans: 'plans' in response,
          plansValue: response.plans,
          responseKeys: Object.keys(response)
        });
        enqueueSnackbar('No subscription plans available at the moment', { variant: 'warning' });
      }
    } catch (error: unknown) {
      console.error('Error fetching subscription plans:', error);
      enqueueSnackbar(`Failed to load subscription plans: ${extractErrorMessage(error)}`, { variant: 'error' });
    } finally {
      setLoadingPlans(false);
    }
  }, [enqueueSnackbar]);

  // Fetch subscription plans when component mounts
  useEffect(() => {
    if (isReady && isLogged) {
      fetchSubscriptionPlans();
    }
  }, [isReady, isLogged, fetchSubscriptionPlans]);

  // Function to fetch user avatar from attachments
  const fetchUserAvatar = useCallback(async () => {
    if (!isLogged || !auth.tokens?.accessToken || !auth.user?._id) {
      console.log('Cannot fetch avatar: not logged in, no tokens, or no user ID');
      return;
    }
    
    try {
      console.log('Fetching user avatar from attachments...');
      const avatarData = await UserAPI.getMe(); // Use getMe instead
      console.log('Avatar data received:', avatarData);
      
      if (avatarData?.user && (avatarData.user as any).avatar?.url) {
        console.log('Avatar from user object:', (avatarData.user as any).avatar.url);
        const fullAvatarUrl = `${app.imageBaseURL}${(avatarData.user as any).avatar.url}`;
        console.log('Full avatar URL:', fullAvatarUrl);
        
        set({
          tokens: auth.tokens,
          user: {
            ...auth.user,
            avatar: { url: fullAvatarUrl },
            photoURL: fullAvatarUrl
          } as AuthUserExtended
        });
        
        console.log('Avatar updated successfully in auth store');
      } else {
        console.log('No avatar data found for user');
      }
    } catch (error: unknown) {
      console.error('Error fetching user avatar:', error);
      console.error('Avatar error details:', {
        message: extractErrorMessage(error),
        error: error
      });
    }
  }, [isLogged, auth.tokens, auth.user, set]);

  // Fetch fresh user data on page load/refresh when auth is ready and user is logged in
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('isReady:', isReady);
    console.log('isLogged:', isLogged);
    console.log('hasTokens:', !!auth.tokens);
    
    if (isReady && isLogged && auth.tokens) {
      console.log('Auth is ready and user is logged in, fetching fresh data...');
      if (!auth.user?.avatar && !auth.user?.photoURL) {
        fetchUserAvatar();
      }
    } else if (isReady && !isLogged) {
      console.log('Auth is ready but user is not logged in');
    } else if (!isReady) {
      console.log('Auth is not ready yet, waiting...');
    }
  }, [isReady, isLogged, auth.tokens, auth.user?.avatar, auth.user?.photoURL, fetchUserAvatar]);

  // Debug logging for avatar
  useEffect(() => {
    console.log('=== Avatar Debug Info ===');
    console.log('auth.user?.avatar:', auth.user?.avatar);
    console.log('auth.user?.photoURL:', auth.user?.photoURL);
    console.log('auth.user:', auth.user);
    
    if (auth.user?.avatar) {
      const avatarUrl = typeof auth.user.avatar === 'string' ? auth.user.avatar : auth.user.avatar.url;
      console.log('Final avatar URL:', avatarUrl);
    } else if (auth.user?.photoURL) {
      console.log('Final photoURL:', auth.user.photoURL);
    } else {
      console.log('No avatar or photoURL found, using default');
    }
  }, [auth.user?.avatar, auth.user?.photoURL, auth.user]);

  // Helper function to construct avatar URL
  const getAvatarUrl = (avatar: AvatarData) => {
    if (avatar?.url) {
      const url = avatar.url;
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      if (url.startsWith('/static/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazad-click-server.onrender.com';
        return `${apiBaseUrl}${url}`;
      }
      
      if (!url.startsWith('/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazad-click-server.onrender.com';
        return `${apiBaseUrl}/static/${url}`;
      }
      
      return url;
    }
    
    return "/assets/images/avatar.jpg";
  };

  // Get the final avatar source
  const avatarSrc = auth.user && auth.user.avatar ? 
                    (typeof auth.user.avatar === 'string' 
                      ? getAvatarUrl({ url: auth.user.avatar }) 
                      : getAvatarUrl(auth.user.avatar)) : 
                    auth.user && auth.user.photoURL && auth.user.photoURL.trim() !== "" ? 
                    getAvatarUrl({ url: auth.user.photoURL }) : 
                    "/assets/images/avatar.jpg";

  // Debug log for final avatar source
  useEffect(() => {
    console.log('=== Final Avatar Source ===');
    console.log('avatarSrc:', avatarSrc);
  }, [avatarSrc]);

  const handleNextStep = async () => {
    if (resellerStep === 3 && selectedPlan && !createdSubscriptionId) {
      // Create subscription when moving from step 3 (plan selection) to step 4 (payment)
      try {
        console.log('Creating subscription for selected plan:', selectedPlan);
        
        // Check if user is authenticated
        if (!auth.user?._id || !auth.tokens?.accessToken) {
          enqueueSnackbar('Authentication error. Please log in again.', { variant: 'error' });
          return;
        }

        // Prepare the subscription data
        const subscriptionData = {
          plan: selectedPlan, // This is the plan ID
          returnUrl: `${window.location.origin}/subscription/payment/success`,
          paymentMethod: 'card'
        };

        console.log('Subscription data:', subscriptionData);

        // Show loading message
        enqueueSnackbar('Creating your subscription...', { 
          variant: 'info',
          autoHideDuration: 2000
        });

        // Create subscription with payment
        const response = await SubscriptionAPI.createSubscriptionWithPayment(subscriptionData);
        
        console.log('Subscription creation response:', response);

        if (response.success && response.subscription) {
          setCreatedSubscriptionId(response.subscription._id || response.subscription.id);
          setCreatedPaymentId(response.payment?.id || response.payment?._id);
          console.log('Subscription created successfully:', response.subscription);
          console.log('Payment created with ID:', response.payment?.id || response.payment?._id);
          
          enqueueSnackbar('Subscription created successfully! Please complete the payment.', { 
            variant: 'success',
            autoHideDuration: 3000
          });

          // Move to next step (payment)
          setResellerStep(prev => prev + 1);
        } else {
          throw new Error(response.message || 'Failed to create subscription');
        }

      } catch (error: unknown) {
        console.error('Error creating subscription:', error);
        const errorMessage = extractErrorMessage(error) || 'Failed to create subscription. Please try again.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        return; // Don't proceed to next step if subscription creation failed
      }
    } else if (resellerStep < 4) {
      // Normal step progression for other steps
      setResellerStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (resellerStep > 1) {
      setResellerStep(prev => prev - 1);
    }
  };

  const handleResellerIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      enqueueSnackbar('Please upload an image or PDF file', { variant: 'error' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('File size should be less than 5MB', { variant: 'error' });
      return;
    }
    
    setResellerIdCard(file);
    enqueueSnackbar('ID Card uploaded successfully!', { variant: 'success' });
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    const planData = subscriptionPlans.find(plan => plan._id === planId);
    setSelectedPlanData(planData || null);
    console.log('Selected plan:', planData);
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to format duration
  const formatDuration = (months: number): string => {
    if (months === 1) return '1 Month';
    if (months < 12) return `${months} Months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${years} Year${years > 1 ? 's' : ''} ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''}`;
  };

  // Helper function to calculate savings
  const calculateSavings = (plan: SubscriptionPlan, monthlyPrice: number): number => {
    const totalMonthlyEquivalent = monthlyPrice * plan.duration;
    return Math.max(0, totalMonthlyEquivalent - plan.price);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !selectedPlanData) {
      enqueueSnackbar('Please select a plan', { variant: 'error' });
      return;
    }
    
    if (!resellerIdCard) {
      enqueueSnackbar('Please upload your ID card', { variant: 'error' });
      return;
    }

    if (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvv || !paymentFormData.cardholderName) {
      enqueueSnackbar('Please fill in all payment details', { variant: 'error' });
      return;
    }

    if (!createdSubscriptionId) {
      enqueueSnackbar('Subscription not found. Please go back and select a plan again.', { variant: 'error' });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const identityFormData = new FormData();
      identityFormData.append('identityCard', resellerIdCard);
      
      console.log('Creating identity record with ID card...');
      console.log('FormData contents:', {
        hasFile: resellerIdCard ? 'Yes' : 'No',
        fileName: resellerIdCard?.name,
        fileSize: resellerIdCard?.size,
        fileType: resellerIdCard?.type
      });
    
      if (!resellerIdCard) {
        enqueueSnackbar('Please select an ID card file', { variant: 'error' });
        return;
      }
      
      if (resellerIdCard.size === 0) {
        enqueueSnackbar('Selected file is empty. Please choose a valid file.', { variant: 'error' });
        return;
      }
      
      if (resellerIdCard.size > 5 * 1024 * 1024) {
        enqueueSnackbar('File size too large. Please choose a file smaller than 5MB.', { variant: 'error' });
        return;
      }
      
      try {
        enqueueSnackbar('Creating identity record...', { 
          variant: 'info',
          autoHideDuration: 2000
        });
        
        const identityResponse = await IdentityAPI.createResellerIdentity(identityFormData);
        console.log('Identity created successfully:', identityResponse);
        
        if (!identityResponse || (!identityResponse.data && !(identityResponse as any)._id)) {
            throw new Error('Failed to create identity record');
          }
        
        console.log('Identity creation validated successfully');
        
        enqueueSnackbar('Identity verification completed successfully!', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        } catch (identityError: unknown) {
          console.error('Identity creation failed:', identityError);
          
          const identityErrorMessage = extractErrorMessage(identityError);
        if ((identityError as any)?.response?.status === 409 || identityErrorMessage?.includes('already exists')) {
          enqueueSnackbar('You already have an identity record. Please contact support if you need assistance.', { 
            variant: 'warning',
            autoHideDuration: 5000
          });
          router.push('/profile');
          return;
        }
        
        enqueueSnackbar(`Identity creation failed: ${extractErrorMessage(identityError) || 'Unknown error'}. Please try again.`, { 
          variant: 'error',
          autoHideDuration: 5000
        });
        return;
      }
      
      console.log('Processing identity creation and user update...');
      
      console.log('Auth state before user update:', {
        isLogged,
        hasUser: !!auth.user,
        hasTokens: !!auth.tokens,
        hasAccessToken: !!auth.tokens?.accessToken,
        tokenLength: auth.tokens?.accessToken?.length || 0
      });
      
      console.log('Testing auth token before conversion...');
      const testToken = UserAPI.testAuth();
      console.log('Test token result:', testToken ? 'Available' : 'Not available');
      
      console.log('=== DIRECT TOKEN CHECK ===');
      
      const authState = authStore.getState();
      console.log('Auth store tokens:', authState.auth?.tokens);
      console.log('Auth store access token:', authState.auth?.tokens?.accessToken ? 'Present' : 'Missing');
      
      const localStorageAuth = localStorage.getItem('auth');
      console.log('localStorage auth:', localStorageAuth);
      if (localStorageAuth) {
        try {
          const parsed = JSON.parse(localStorageAuth);
          console.log('Parsed localStorage tokens:', parsed?.tokens);
          console.log('localStorage access token:', parsed?.tokens?.accessToken ? 'Present' : 'Missing');
          
          if (parsed?.tokens?.accessToken && !authState.auth?.tokens?.accessToken) {
            console.log('Force syncing auth store with localStorage...');
            authStore.getState().refreshAuthState();
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Error parsing localStorage:', error);
        }
      }
      
      console.log('useAuth tokens:', auth.tokens);
      console.log('useAuth access token:', auth.tokens?.accessToken ? 'Present' : 'Missing');
      
      console.log('Testing server connectivity...');
      try {
        const testResponse = await fetch('https://mazad-click-server.onrender.com/health');
        console.log('Server health check status:', testResponse.status);
      } catch (testError) {
        console.warn('Server health check failed:', testError);
        enqueueSnackbar('Server connection issue. Please check if the server is running.', { 
          variant: 'warning',
          autoHideDuration: 3000
        });
      }
      
      if (!auth.tokens?.accessToken) {
        console.error('No access token available for reseller conversion');
        
        console.log('Attempting to refresh auth state...');
        authStore.getState().refreshAuthState();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const freshAuthState = authStore.getState();
        console.log('Fresh auth state after refresh:', {
          isReady: freshAuthState.isReady,
          isLogged: freshAuthState.isLogged,
          hasTokens: !!freshAuthState.auth?.tokens,
          hasAccessToken: !!freshAuthState.auth?.tokens?.accessToken
        });
        
        if (!freshAuthState.auth?.tokens?.accessToken) {
          enqueueSnackbar('Authentication error. Please try logging in again.', { 
            variant: 'error',
            autoHideDuration: 5000
          });
          return;
        }
        
        console.log('Auth state refreshed successfully');
      }
      
      console.log('Starting user update with identity...');
      try {
        console.log('Updating user with identity information...');
        
        const updateResponse = await UserAPI.updateUserWithIdentity();
        
        console.log('User update response received:', updateResponse);
        
        if (!updateResponse || !updateResponse.success) {
          throw new Error(updateResponse?.message || 'User update failed - no response or success flag');
        }
        
        console.log('User updated successfully with identity!');
        
        if (updateResponse.data) {
        set({
          tokens: auth.tokens,
          user: {
            ...auth.user,
              ...updateResponse.data,
              isHasIdentity: true
          } as AuthUserExtended
        });
        }
        
        // Confirm the payment if we have a payment ID
        if (createdPaymentId) {
          try {
            console.log('Confirming payment:', createdPaymentId);
            const paymentConfirmation = await SubscriptionAPI.confirmPayment(createdPaymentId);
            console.log('Payment confirmation response:', paymentConfirmation);
            
            if (paymentConfirmation.success) {
              enqueueSnackbar('Payment confirmed successfully!', { 
                variant: 'success',
                autoHideDuration: 3000
              });
            }
          } catch (paymentError: unknown) {
            console.warn('Payment confirmation failed, but continuing...', paymentError);
            // Don't block the flow if payment confirmation fails
          }
        }
        
        enqueueSnackbar(
          'Congratulations! Your reseller subscription has been created, your identity has been verified, and your account has been successfully updated.',
          { 
            variant: 'success',
            autoHideDuration: 8000
          }
        );
      
        router.push('/profile');
        
      } catch (updateError: unknown) {
        console.error('User update failed:', updateError);
        
        const errorMessage = extractErrorMessage(updateError);
        if (errorMessage?.includes('Token not found') || errorMessage?.includes('Unauthorized')) {
          enqueueSnackbar('Authentication expired. Please try logging in again.', { 
            variant: 'error',
            autoHideDuration: 5000
          });
          return;
        }
        
        throw new Error(`User update failed: ${errorMessage || 'Unknown error'}`);
      }
      
    } catch (error: unknown) {
      console.error('Reseller conversion error:', error);
      console.error('Error details:', {
        message: extractErrorMessage(error),
        errorType: typeof error,
        errorKeys: error ? Object.keys(error as Record<string, unknown>) : 'No error object'
      });
      
      const errorMessage = extractErrorMessage(error) || 'Failed to process reseller conversion. Please try again.';
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBackToProfile = () => {
    router.push('/profile');
  };

  return (
    <ProtectedResellerRoute>
      <div>
        <RequestProvider>
          <Header />
          <main className="become-reseller-page">
            <div className="reseller-container">
              <motion.div 
                className="reseller-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="header-buttons">
                  <button className="back-button" onClick={handleBackToProfile}>
                    <i className="bi bi-arrow-left"></i> Back to Profile
                  </button>
                </div>
                <h1>
                  <i className="bi bi-shop"></i>
                  Become a Reseller
                </h1>
                <p>Complete the steps below to upgrade your account to a reseller account</p>
              </motion.div>

              <div className="reseller-content">
                <div className="progress-section">
                  <div className="progress-steps">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className={`progress-step ${resellerStep >= step ? 'active' : ''}`}>
                        <div className="step-number">{step}</div>
                        <div className="step-title">
                          {step === 1 && 'Requirements'}
                          {step === 2 && 'ID Verification'}
                          {step === 3 && 'Choose Plan'}
                          {step === 4 && 'Payment'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="progress-bar">
                    <motion.div 
                      className="progress-fill"
                      initial={{ width: '25%' }}
                      animate={{ width: `${(resellerStep / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="step-content-section">
                  {/* Step 1: Requirements */}
                  {resellerStep === 1 && (
                    <motion.div 
                      className="step-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="step-icon">
                        <i className="bi bi-info-circle"></i>
                      </div>
                      <h3>Important Information</h3>
                      <div className="requirements-list">
                        <div className="requirement-item">
                          <i className="bi bi-check-circle"></i>
                          <div>
                            <h4>Identity Verification</h4>
                            <p>Upload a clear photo of your national ID card or passport for verification purposes.</p>
                          </div>
                        </div>
                        <div className="requirement-item">
                          <i className="bi bi-credit-card"></i>
                          <div>
                            <h4>Payment Method</h4>
                            <p>A valid payment method is required to complete your reseller subscription.</p>
                          </div>
                        </div>
                        <div className="requirement-item">
                          <i className="bi bi-shield-check"></i>
                          <div>
                            <h4>Account Verification</h4>
                            <p>Your account will be reviewed and verified within 24-48 hours after completion.</p>
                          </div>
                        </div>
                        <div className="requirement-item">
                          <i className="bi bi-graph-up"></i>
                          <div>
                            <h4>Reseller Benefits</h4>
                            <p>Access to advanced selling tools, analytics, and priority customer support.</p>
                          </div>
                        </div>
                        <div className="requirement-item">
                          <i className="bi bi-star-fill"></i>
                          <div>
                            <h4>Rating Boost</h4>
                            <p>Your user rating will be increased by 2 points upon successful conversion to reseller status.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: ID Card Upload */}
                  {resellerStep === 2 && (
                    <motion.div 
                      className="step-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="step-icon">
                        <i className="bi bi-card-image"></i>
                      </div>
                      <h3>Upload Your ID Card</h3>
                      <p>Please upload a clear photo of your national ID card or passport.</p>
                      
                      <div className="id-upload-container">
                        <input
                          type="file"
                          ref={resellerIdCardRef}
                          style={{ display: 'none' }}
                          accept="image/*, application/pdf"
                          onChange={handleResellerIdCardChange}
                        />
                        <div 
                          className={`upload-dropzone ${resellerIdCard ? 'has-file' : ''}`}
                          onClick={() => resellerIdCardRef.current?.click()}
                        >
                          {resellerIdCard ? (
                            <div className="file-preview">
                              <i className="bi bi-file-earmark-check"></i>
                              <h4>File Uploaded Successfully</h4>
                              <p>{resellerIdCard.name}</p>
                              <button 
                                className="change-file-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resellerIdCardRef.current?.click();
                                }}
                              >
                                Change File
                              </button>
                            </div>
                          ) : (
                            <div className="upload-placeholder">
                              <i className="bi bi-cloud-upload"></i>
                              <h4>Drop your ID card here</h4>
                              <p>or click to browse files</p>
                              <small>Supports: JPG, PNG, PDF (Max 5MB)</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Plan Selection */}
                  {resellerStep === 3 && (
                    <motion.div 
                      className="step-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="step-icon">
                        <i className="bi bi-gem"></i>
                      </div>
                      <h3>Choose Your Plan</h3>
                      <p>Select the subscription plan that best fits your needs.</p>
                      
                      <div className="plans-container">
                        {loadingPlans ? (
                          <div className="loading-plans">
                            <div className="spinner"></div>
                            <p>Loading subscription plans...</p>
                          </div>
                        ) : subscriptionPlans.length > 0 ? (
                          subscriptionPlans.map((plan, index) => {
                            const isPopular = subscriptionPlans.length === 3 && index === 1;
                            const monthlyPlan = subscriptionPlans.find(p => p.duration === 1);
                            const savings = monthlyPlan ? calculateSavings(plan, monthlyPlan.price) : 0;
                            
                            return (
                              <div 
                                key={plan._id}
                                className={`plan-card ${isPopular ? 'popular' : ''} ${selectedPlan === plan._id ? 'selected' : ''}`}
                                onClick={() => handlePlanSelection(plan._id!)}
                              >
                                {isPopular && <div className="plan-badge">Most Popular</div>}
                                <div className="plan-header">
                                  <h4>{formatDuration(plan.duration)}</h4>
                                  <div className="plan-price">
                                    <span className="currency">DZD</span>
                                    <span className="amount">{plan.price}</span>
                                    <span className="period">/{formatDuration(plan.duration).toLowerCase()}</span>
                                  </div>
                                  {savings > 0 && <div className="plan-savings">Save ${savings}</div>}
                                </div>
                                <div className="plan-description">
                                  <p>{plan.description}</p>
                                </div>
                                <div className="plan-features">
                                  <div className="feature">
                                    <i className="bi bi-check"></i>
                                    <span>{plan.duration === 1 ? 'Basic selling tools' : 'Advanced selling tools'}</span>
                                  </div>
                                  <div className="feature">
                                    <i className="bi bi-check"></i>
                                    <span>{plan.duration === 1 ? 'Standard support' : 'Priority support'}</span>
                                  </div>
                                  <div className="feature">
                                    <i className="bi bi-check"></i>
                                    <span>{plan.duration === 1 ? 'Basic analytics' : 'Advanced analytics'}</span>
                                  </div>
                                  {plan.duration > 1 && (
                                    <div className="feature">
                                      <i className="bi bi-check"></i>
                                      <span>Marketing tools</span>
                                    </div>
                                  )}
                                  {plan.duration >= 6 && (
                                    <>
                                      <div className="feature">
                                        <i className="bi bi-check"></i>
                                        <span>API access</span>
                                      </div>
                                      <div className="feature">
                                        <i className="bi bi-check"></i>
                                        <span>VIP support</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-plans">
                            <i className="bi bi-exclamation-triangle"></i>
                            <h4>No Plans Available</h4>
                            <p>No subscription plans are currently available. Please try again later or contact support.</p>
                            <button 
                              className="retry-btn"
                              onClick={fetchSubscriptionPlans}
                            >
                              <i className="bi bi-arrow-clockwise"></i>
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Payment */}
                  {resellerStep === 4 && (
                    <motion.div 
                      className="step-content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="step-icon">
                        <i className="bi bi-credit-card"></i>
                      </div>
                      <h3>Complete Identity Verification</h3>
                      <p>Your subscription has been created! Complete the identity verification to finalize your reseller account.</p>
                      
                      {/* Subscription status indicator */}
                      {createdSubscriptionId && (
                        <div className="subscription-status">
                          <div className="status-item success">
                            <i className="bi bi-check-circle"></i>
                            <span>Subscription Created Successfully</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="payment-summary">
                        <div className="summary-item">
                          <span>Selected Plan:</span>
                          <strong>
                            {selectedPlanData ? `${selectedPlanData.name} (${formatDuration(selectedPlanData.duration)})` : 'No plan selected'}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span>Price:</span>
                          <strong>
                            {selectedPlanData ? `${selectedPlanData.price}` : '$0'}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span>Duration:</span>
                          <strong>
                            {selectedPlanData ? formatDuration(selectedPlanData.duration) : 'N/A'}
                          </strong>
                        </div>
                        {createdSubscriptionId && (
                          <div className="summary-item">
                            <span>Subscription ID:</span>
                            <strong>{createdSubscriptionId}</strong>
                          </div>
                        )}
                        <div className="summary-item">
                          <span>ID Verification:</span>
                          <strong className="verified">
                            <i className="bi bi-check-circle"></i> Ready to Create Identity
                          </strong>
                        </div>
                      </div>

                      <div className="payment-methods">
                        <h4>Payment Method</h4>
                        <div className="payment-options">
                          <div className="payment-option active">
                            <i className="bi bi-credit-card"></i>
                            <span>Credit/Debit Card</span>
                          </div>
                          <div className="payment-option">
                            <i className="bi bi-paypal"></i>
                            <span>PayPal</span>
                          </div>
                        </div>
                      </div>

                      <div className="payment-form">
                        <div className="form-group">
                          <label>Card Number</label>
                          <input 
                            type="text" 
                            name="cardNumber"
                            value={paymentFormData.cardNumber}
                            onChange={handlePaymentFormChange}
                            placeholder="1234 5678 9012 3456" 
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Expiry Date</label>
                            <input 
                              type="text" 
                              name="expiryDate"
                              value={paymentFormData.expiryDate}
                              onChange={handlePaymentFormChange}
                              placeholder="MM/YY" 
                            />
                          </div>
                          <div className="form-group">
                            <label>CVV</label>
                            <input 
                              type="text" 
                              name="cvv"
                              value={paymentFormData.cvv}
                              onChange={handlePaymentFormChange}
                              placeholder="123" 
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Cardholder Name</label>
                          <input 
                            type="text" 
                            name="cardholderName"
                            value={paymentFormData.cardholderName}
                            onChange={handlePaymentFormChange}
                            placeholder={t("becomeReseller.placeholderName")} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="step-navigation">
                  <div className={`navigation-buttons ${resellerStep === 1 ? 'single-button' : ''}`}>
                    {resellerStep > 1 && (
                      <button 
                        className="btn-secondary"
                        onClick={handlePrevStep}
                        disabled={isProcessingPayment}
                      >
                        <i className="bi bi-arrow-left"></i> Previous
                      </button>
                    )}
                    
                    {resellerStep < 4 ? (
                      <button 
                        className="btn-primary"
                        onClick={handleNextStep}
                        disabled={(resellerStep === 2 && !resellerIdCard) || (resellerStep === 3 && !selectedPlan)}
                      >
                        Next <i className="bi bi-arrow-right"></i>
                      </button>
                    ) : (
                      <button 
                        className="btn-payment"
                        onClick={handlePayment}
                        disabled={
                          isProcessingPayment || 
                          !paymentFormData.cardNumber || 
                          !paymentFormData.expiryDate || 
                          !paymentFormData.cvv || 
                          !paymentFormData.cardholderName
                        }
                      >
                        {isProcessingPayment ? (
                          <>
                            <span className="spinner"></span>
                            {resellerStep === 4 ? 'Creating Identity & Updating Account...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle"></i>
                            Complete Identity Verification
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </RequestProvider>
      </div>
    </ProtectedResellerRoute>
  );
}