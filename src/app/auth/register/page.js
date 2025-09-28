"use client";
import { useState, useEffect } from "react";
import "./style.css";
import Link from "next/link";
import Image from "next/image";
import "../login/style.css";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FiMail, FiLock, FiUser, FiPhone, FiUsers, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import Header from "@/components/header/Header";
import { AuthAPI } from "@/app/api/auth";
import { TermsAPI } from "@/app/api/terms";
import useAuth from "@/hooks/useAuth";
import { CLIENT_TYPE } from "@/types/User";
import InteractiveBackground from "@/components/common/InteractiveBackground";

export default function Register() {
  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    gender: "",
    email: "",
    password: "",
    phone: "",
    type: "BUYER",
    sellerType: "",
  });
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const { set } = useAuth();

  function changeData(e) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleOpenTerms = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Opening terms modal...');
    setTermsModalOpen(true);
    
    // Load terms from API if not already loaded
    if (!termsContent) {
      await loadTermsContent();
    }
  };

  const loadTermsContent = async () => {
  setIsLoadingTerms(true);
  try {
    console.log('Loading terms from API...'); // Debug log
    
    // Try to get the latest terms from the API
    const terms = await TermsAPI.getLatest();
    console.log('Terms API response:', terms); // Debug log to see what's returned
    
    // Check different possible response structures
    const termsData = terms?.data || terms; // Handle cases where response is wrapped in .data
    console.log('Processed terms data:', termsData); // Debug log
    
    if (termsData && (termsData.content || termsData.description || termsData.text)) {
      const content = termsData.content || termsData.description || termsData.text;
      const title = termsData.title || termsData.name || 'Termes et Conditions d\'Utilisation';
      
      // Format the terms content for display
      const formattedContent = `
        <div style="line-height: 1.6; color: #333;">
          <h2 style="color: white; margin-bottom: 16px;">${title}</h2>
          <div>${content}</div>
          ${termsData.updatedAt || termsData.updated_at ? `
            <p style="margin-top: 32px; font-style: italic; color: #666;">
              Dernière mise à jour : ${new Date(termsData.updatedAt || termsData.updated_at).toLocaleDateString('fr-FR')}
            </p>
          ` : ''}
        </div>
      `;
      setTermsContent(formattedContent);
    } 
    // Try to handle array response (in case getLatest returns array)
    else if (Array.isArray(termsData) && termsData.length > 0) {
      const firstTerm = termsData[0];
      const content = firstTerm.content || firstTerm.description || firstTerm.text;
      const title = firstTerm.title || firstTerm.name || 'Termes et Conditions d\'Utilisation';
      
      if (content) {
        const formattedContent = `
          <div style="line-height: 1.6; color: #333;">
            <h2 style="color: white; margin-bottom: 16px;">${title}</h2>
            <div>${content}</div>
            ${firstTerm.updatedAt || firstTerm.updated_at ? `
              <p style="margin-top: 32px; font-style: italic; color: #666;">
                Dernière mise à jour : ${new Date(firstTerm.updatedAt || firstTerm.updated_at).toLocaleDateString('fr-FR')}
              </p>
            ` : ''}
          </div>
        `;
        setTermsContent(formattedContent);
      } else {
        throw new Error('No content field found in terms data');
      }
    }
    else {
      console.warn('Invalid terms structure:', termsData);
      // Fallback if no content is returned
      setTermsContent(`
        <div style="line-height: 1.6; color: #333; text-align: center; padding: 40px 20px;">
          <div style="color: #ff9800; margin-bottom: 16px; display: flex; justify-content: center;">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 style="color: #666;">Aucun contenu disponible pour le moment</h3>
          <p>Les termes et conditions n'ont pas encore été configurés.</p>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading terms:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    setTermsContent(`
      <div style="line-height: 1.6; color: #333; text-align: center; padding: 40px 20px;">
        <div style="color: #ff9800; margin-bottom: 16px; display: flex; justify-content: center;">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h3 style="color: #666;">Erreur de chargement</h3>
        <p>Impossible de charger les termes et conditions. Veuillez réessayer plus tard.</p>
        <p style="font-size: 12px; color: #999; margin-top: 16px;">
          Erreur: ${error.message}
        </p>
      </div>
    `);
  } finally {
    setIsLoadingTerms(false);
  }
};

  const handleCloseTerms = () => {
    console.log('Closing terms modal...');
    setTermsModalOpen(false);
  };

  const handleSubmit = async () => {
    // Check if terms are accepted
    if (!termsAccepted) {
      setSnackbarMessage('Please accept the terms and conditions to continue.');
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      // Prepare user data for signup
      const userData = {
        firstName: data.firstname,
        lastName: data.lastname,
        email: data.email,
        password: data.password,
        phone: data.phone,
        type: CLIENT_TYPE.CLIENT
      };
      console.log('Sending signup data:', userData);
      
      // Call signup API
      const response = await AuthAPI.signup(userData);
      console.log('Signup response received:', response);
      
      // Extract the actual response data (response.data contains the API response)
      const responseData = response.data || response;
      
      // Check if phone verification is required
      if (responseData && responseData.user && responseData.requiresPhoneVerification) {
        console.log('Phone verification required, redirecting to OTP...');
        setSnackbarMessage('Registration successful! Please verify your phone number.');
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // Redirect to seller app OTP verification page
        setTimeout(() => {
          const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
          const otpUrl = `${baseUrl}/otp-verification?phone=${encodeURIComponent(userData.phone)}&fromBuyer=true`;
          console.log('Redirecting to:', otpUrl);
          window.location.href = otpUrl;
        }, 2000);
      }
      // Handle case where user is created with tokens
      else if (responseData && responseData.user && (responseData.tokens || (responseData.accessToken && responseData.refreshToken) || (responseData.access_token && responseData.refresh_token))) {
        console.log('User created with authentication tokens');
        
        // Normalize token structure
        const tokens = responseData.tokens || {
          accessToken: responseData.accessToken || responseData.access_token,
          refreshToken: responseData.refreshToken || responseData.refresh_token
        };
        
        const authData = {
          user: responseData.user,
          tokens: tokens
        };
        
        set(authData);
        setSnackbarMessage('Registration successful! Please verify your phone number.');
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // Redirect to OTP verification for phone verification
        setTimeout(() => {
          const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
          const otpUrl = `${baseUrl}/otp-verification?phone=${encodeURIComponent(userData.phone)}&fromBuyer=true`;
          console.log('Redirecting to:', otpUrl);
          window.location.href = otpUrl;
        }, 2000);
      }
      // Handle case where user is created but no phone verification required
      else if (responseData && responseData.user) {
        console.log('User created without phone verification requirement');
        setSnackbarMessage('Registration successful! Please verify your phone number.');
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // If no verification required, redirect to dashboard after delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      else {
        console.error('Invalid response structure:', responseData);
        setSnackbarMessage('Registration successful! Please verify your phone number.');
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Something went wrong. Please try again.';
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <InteractiveBackground 
        theme="light" 
        enableDots={true}
        enableGeometry={true}
        enableWaves={true}
        enableMouseTrail={true}
        particleCount={50}
      />
      <div className="auth-page">
      <Header/>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-content">
            <div className="auth-header">
              <div className="auth-logo">
                <Image src="/assets/images/logo-dark.png" alt="MazadClick Logo" width={150} height={50} />
              </div>
              <h1>Create Your Account</h1>
              <p>Join our auction community and start bidding today</p>
            </div>

            <div className="auth-form">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="firstname">First Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      id="firstname"
                      type="text"
                      placeholder="Enter your first name"
                      name="firstname"
                      value={data.firstname}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
                <div className="form-group half">
                  <label htmlFor="lastname">Last Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      id="lastname"
                      type="text"
                      placeholder="Enter your last name"
                      name="lastname"
                      value={data.lastname}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="phone">Phone Number</label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" />
                    <input
                      id="phone"
                      type="text"
                      placeholder="Enter your phone number"
                      name="phone"
                      value={data.phone}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
                <div className="form-group half">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      name="email"
                      value={data.email}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <div className="input-wrapper">
                  <FiUsers className="input-icon" />
                  <select
                    id="gender"
                    name="gender"
                    value={data.gender}
                    onChange={changeData}
                    className="select-input"
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                      placeholder="Create a strong password"
                    name="password"
                    value={data.password}
                    onChange={changeData}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              {/* Terms and Conditions Section */}
              <div className="terms-agreement-section" style={{
                padding: '24px',
                borderRadius: '16px',
                border: `2px solid ${termsAccepted ? '#10b981' : '#e5e7eb'}`,
                background: termsAccepted 
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' 
                  : 'linear-gradient(135deg, #fafafa 0%, #f9fafb 100%)',
                marginTop: '20px',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: termsAccepted 
                  ? '0 8px 25px rgba(16, 185, 129, 0.15)' 
                  : '0 4px 15px rgba(0, 0, 0, 0.05)'
              }}>
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '100px',
                  height: '100px',
                  background: termsAccepted 
                    ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)' 
                    : 'radial-gradient(circle, rgba(156, 163, 175, 0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '16px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* Custom checkbox */}
                  <div style={{ position: 'relative', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{
                        width: '20px',
                        height: '20px',
                        margin: 0,
                        opacity: 0,
                        position: 'absolute',
                        cursor: 'pointer'
                      }}
                    />
                    <div className="terms-checkbox" style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${termsAccepted ? '#10b981' : '#d1d5db'}`,
                      borderRadius: '6px',
                      background: termsAccepted ? '#10b981' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: termsAccepted 
                        ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                        : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {termsAccepted && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          style={{ 
                            color: 'white',
                            animation: 'checkmark 0.3s ease'
                          }}
                        >
                          <path 
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" 
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                  <label htmlFor="termsAccepted" style={{
                      fontSize: '15px',
                      lineHeight: '1.6',
                      color: termsAccepted ? '#065f46' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'block'
                    }}>
                      I agree to the{' '}
                    <span
                        className="terms-link"
                      onClick={handleOpenTerms}
                      style={{
                          color: '#6366f1',
                          textDecoration: 'none',
                        cursor: 'pointer',
                          fontWeight: '600',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.2s ease',
                          borderBottom: '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(99, 102, 241, 0.2)';
                          e.target.style.borderBottom = '2px solid #6366f1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                          e.target.style.borderBottom = '2px solid transparent';
                        }}
                      >
                        Terms and Conditions
                    </span>
                      {' '}and{' '}
                    <span
                        className="terms-link"
                      onClick={handleOpenTerms}
                      style={{
                          color: '#6366f1',
                          textDecoration: 'none',
                        cursor: 'pointer',
                          fontWeight: '600',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.2s ease',
                          borderBottom: '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(99, 102, 241, 0.2)';
                          e.target.style.borderBottom = '2px solid #6366f1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                          e.target.style.borderBottom = '2px solid transparent';
                        }}
                      >
                        Privacy Policy
                    </span>
                      {' '}to create my account.
                  </label>
                    
                    {/* Success message when accepted */}
                    {termsAccepted && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          style={{ color: '#10b981', minWidth: '16px' }}
                        >
                          <path 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                            fill="currentColor"
                          />
                        </svg>
                        <span style={{ 
                          fontSize: '13px', 
                          color: '#065f46',
                          fontWeight: '500'
                        }}>
                          Great! You can now proceed with registration.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Warning message when not accepted */}
                {!termsAccepted && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <FiAlertCircle style={{ 
                      color: '#f59e0b', 
                      minWidth: '18px',
                      fontSize: '18px'
                    }} />
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#92400e',
                        fontWeight: '600',
                        marginBottom: '2px'
                      }}>
                        Terms Required
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#a16207'
                      }}>
                        Please read and accept our terms to continue with registration.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                className={`auth-button ${loading ? 'loading' : ''} ${!termsAccepted ? 'disabled' : ''}`}
                onClick={handleSubmit}
                disabled={loading || !termsAccepted}
                style={{
                  opacity: !termsAccepted ? 0.6 : 1,
                  cursor: !termsAccepted ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="btn-content">
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  {!loading && (
                    <FiArrowRight size={20} />
                  )}
                </div>
              </button>

              <div className="auth-footer">
                {/* Signin link removed */}
              </div>
            </div>
          </div>
          
          <div className="auth-card-decoration">
            {/* Background decorative elements */}
            <div className="decoration-background">
              <div className="floating-icon auction-hammer">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" fill="rgba(255, 255, 255, 0.1)"/>
                  <path d="M12 6v6l4 4" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="floating-icon money-bag">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.69 2 6 4.69 6 8c0 2.5 1.5 4.5 3.5 5.5v3c0 .55.45 1 1 1s1-.45 1-1v-3c2-.5 3.5-2.5 3.5-5 0-3.31-2.69-6-6-6z" fill="rgba(255, 255, 255, 0.1)"/>
                  <path d="M10 11h4c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1s.45-1 1-1z" fill="rgba(255, 255, 255, 0.8)"/>
                </svg>
              </div>
              <div className="floating-icon trophy">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2v6c0 2.97 2.16 5.43 5 5.91V19H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-3v-3.09c2.84-.48 5-2.94 5-5.91V2H6z" fill="rgba(255, 255, 255, 0.1)"/>
                  <path d="M10 6h4v2h-4V6z" fill="rgba(255, 255, 255, 0.8)"/>
                </svg>
              </div>
            </div>

            {/* Main content */}
            <div className="decoration-main-content">
              {/* Welcome Badge */}
              <div className="welcome-badge">
                  <span className="badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                  </svg>
                </span>
                <span>Welcome to MazadClick</span>
              </div>

              {/* Main Title */}
              <h2 className="decoration-title">
                Join Our <span className="highlight-text">Auction</span><br/>
                Community
              </h2>
              
              {/* Subtitle */}
              <p className="decoration-subtitle">
                Discover unique products, bid on amazing deals, and win auctions at incredible prices. 
                Your journey to amazing finds starts here!
              </p>

              {/* Feature Highlights */}
              <div className="feature-highlights">
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5C21.8284 11.5 22.5 10.8284 22.5 10C22.5 9.17157 21.8284 8.5 21 8.5C20.1716 8.5 19.5 9.17157 19.5 10C19.5 10.8284 20.1716 11.5 21 11.5Z" fill="currentColor"/>
                      <path d="M3 11.5C3.82843 11.5 4.5 10.8284 4.5 10C4.5 9.17157 3.82843 8.5 3 8.5C2.17157 8.5 1.5 9.17157 1.5 10C1.5 10.8284 2.17157 11.5 3 11.5Z" fill="currentColor"/>
                      <path d="M12 22.5C12.8284 22.5 13.5 21.8284 13.5 21C13.5 20.1716 12.8284 19.5 12 19.5C11.1716 19.5 10.5 20.1716 10.5 21C10.5 21.8284 11.1716 22.5 12 22.5Z" fill="currentColor"/>
                      <path d="M12 4.5C12.8284 4.5 13.5 3.82843 13.5 3C13.5 2.17157 12.8284 1.5 12 1.5C11.1716 1.5 10.5 2.17157 10.5 3C10.5 3.82843 11.1716 4.5 12 4.5Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Live Auctions</h4>
                    <p>Real-time bidding experience</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.18 10.16 8.49 10.96 8.49H12.84C13.76 8.49 14.51 9.27 14.51 10.24M12 7.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Secure Payments</h4>
                    <p>Safe and encrypted transactions</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.06 18.67L16.92 14.4L14.78 18.67M8.5 11L6.36 6.73L4.22 11M2 9V4C2 3.45 2.45 3 3 3H11C11.55 3 12 3.45 12 4V9C12 9.55 11.55 10 11 10H3C2.45 10 2 9.55 2 9ZM12 20V15C12 14.45 12.45 14 13 14H21C21.55 14 22 14.45 22 15V20C22 20.55 21.55 21 21 21H13C12.45 21 12 20.55 12 20Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h4>Best Prices</h4>
                    <p>Competitive auction pricing</p>
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="community-stats">
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Items Sold</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99%</div>
                  <div className="stat-label">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <Dialog 
        open={termsModalOpen} 
        onClose={handleCloseTerms}
        maxWidth="md" 
        fullWidth
        PaperProps={{
          style: { borderRadius: '8px', maxHeight: '80vh' }
        }}
      >
        <DialogTitle style={{ 
          borderBottom: '1px solid #e0e0e0',
          fontWeight: '600',
          fontSize: '1.25rem',
          padding: '16px 24px'
        }}>
          Terms and Conditions
        </DialogTitle>
        <DialogContent dividers style={{ padding: 0 }}>
          <Box style={{ 
            height: '450px', 
            overflow: 'auto', 
            padding: '24px'
          }}>
            {isLoadingTerms ? (
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <CircularProgress size={40} />
                <Typography style={{ marginTop: '16px' }}>
                  Loading...
                </Typography>
              </Box>
            ) : termsContent ? (
              <div 
                dangerouslySetInnerHTML={{ __html: termsContent }}
                style={{
                  lineHeight: '1.6',
                  fontSize: '14px'
                }}
              />
            ) : (
              <Box style={{ textAlign: 'center', padding: '32px' }}>
                <FiAlertCircle size={48} style={{ color: '#ff9800', marginBottom: '16px' }} />
                <Typography style={{ color: '#666' }}>
                  Something went wrong
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', gap: '8px' }}>
          <Button onClick={handleCloseTerms} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
    </>
  );
}