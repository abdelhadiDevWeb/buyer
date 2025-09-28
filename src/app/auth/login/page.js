"use client";
import { useState, useEffect } from "react";
import "./style.css";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthAPI } from "@/app/api/auth";
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { authStore } from "@/contexts/authStore";
import useAuth from "@/hooks/useAuth"
import Header from "@/components/header/Header";
import SocketProvider from "@/contexts/socket";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InteractiveBackground from "@/components/common/InteractiveBackground";

// Create a wrapper component with SocketProvider
function LoginWrapper() {
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
      <SocketProvider>
        <LoginComponent />
      </SocketProvider>
    </>
  );
}

function LoginComponent() {
  const router = useRouter();
  const [data, setData] = useState({
    login: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const {set} = useAuth()

  // Initialize auth store on component mount
  useEffect(() => {
    authStore.getState().initializeAuth();
  }, []);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const credentials = {
        login: data.login,
        password: data.password
      };

      const response = await AuthAPI.signin(credentials);
      console.log("API response:", response);
      console.log("Full response structure:", JSON.stringify(response, null, 2));

      // Handle error response from API
      if (response?.error || response?.message) {
        throw new Error(response.error || response.message);
      }

      // More flexible response handling - check for user data
      const user = response?.data?.user || response?.user;
      const session = response?.data?.session || response?.session || response?.data;

      if (user) {
        console.log('🔐 Login successful - User data:', user);
        console.log('🔐 Login successful - Session data:', session);
        
        // Check if user is banned (keeping this for security)
        if (user.isBanned) {
          setSnackbarMessage('Compte banni');
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          return;
        }
        
        // Removed verification checks - users can login regardless of verification status
        
        // Extract tokens with fallback for different property names
        const accessToken = session?.accessToken || 
                           session?.access_token || 
                           response?.data?.accessToken || 
                           response?.data?.access_token || 
                           response?.accessToken || 
                           response?.access_token;

        const refreshToken = session?.refreshToken || 
                            session?.refresh_token || 
                            response?.data?.refreshToken || 
                            response?.data?.refresh_token || 
                            response?.refreshToken || 
                            response?.refresh_token;

        console.log('🔐 Extracted tokens:', { accessToken, refreshToken });

        const authData = {
          user: user,
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        };
        
        console.log('🔐 Storing auth data:', authData);
        set(authData);
        
        // Verify data was stored correctly
        setTimeout(() => {
          const storedAuth = authStore.getState();
          console.log('🔐 Stored auth state:', storedAuth);
          
          // Test token storage
          authStore.getState().testTokenStorage();
          
          // Check localStorage directly
          const localStorageAuth = localStorage.getItem('auth');
          console.log('🔐 localStorage after login:', localStorageAuth);
        }, 100);
        
        setSnackbarMessage('Connexion réussie');
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Log the actual response structure for debugging
        console.error("Unexpected response structure:", response);
        throw new Error('Identifiants invalides');
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      let errorMessage = 'Une erreur est survenue';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Removed phone verification redirect logic - all login errors are treated as general errors
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
    <div className="auth-page">
      <Header/>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-content">
            <div className="auth-header">
              <div className="auth-logo">
                <Image src="/assets/images/logo-dark.png" alt="MazadClick Logo" width={150} height={50} />
              </div>
              <h1>Welcome Back!</h1>
              <p>Sign in to access your account and continue bidding</p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <label htmlFor="login">Email or Phone</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="login"
                    type="text"
                    placeholder="Entrez votre email ou téléphone"
                    value={data.login}
                    onChange={(e) => setData({ ...data, login: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Mot de passe</label>
                  <Link href="/auth/forgot-password" className="forgot-link">
                    Mot de passe oublié?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <button 
                className={`auth-button ${loading ? 'loading' : ''}`} 
                onClick={handleSubmit}
                disabled={loading}
              >
                <div className="btn-content">
                  <span>{loading ? "Connexion en cours..." : "Se connecter"}</span>
                  {!loading && (
                    <FiArrowRight size={20} />
                  )}
                </div>
              </button>

              <div className="auth-footer">
                <p>
                  Vous n'avez pas de compte?{" "}
                  <a href="/auth/register" className="signup-link">
                    S'inscrire
                  </a>
                </p>
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
                <span>Welcome Back to MazadClick</span>
              </div>

              {/* Main Title */}
              <h2 className="decoration-title">
                Discover Amazing <span className="highlight-text">Auctions</span><br/>
                & Start Bidding
              </h2>
              
              {/* Subtitle */}
              <p className="decoration-subtitle">
                Access your account and continue your journey with incredible auctions, 
                real-time bidding, and amazing deals waiting for you!
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default LoginWrapper;