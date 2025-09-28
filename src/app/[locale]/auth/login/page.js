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
          setSnackbarMessage('Your account has been banned. Please contact support.');
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
        
        setSnackbarMessage('Login successful! Welcome back.');
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Log the actual response structure for debugging
        console.error("Unexpected response structure:", response);
        throw new Error('Invalid credentials. Please check your email/phone and password.');
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      let errorMessage = 'Something went wrong. Please try again.';
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
                  <a href="http://localhost:3001/auth/register" className="signup-link">
                    S'inscrire
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="auth-card-decoration">
            <div className="decoration-content">
              <h2>Découvrez des Enchères Incroyables</h2>
              <p>Enchérissez, gagnez et profitez d'une expérience d'enchère fluide avec MazadClick.</p>
              <div className="decoration-badges">
                <div className="badge">
                  <span className="badge-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5C21.8284 11.5 22.5 10.8284 22.5 10C22.5 9.17157 21.8284 8.5 21 8.5C20.1716 8.5 19.5 9.17157 19.5 10C19.5 10.8284 20.1716 11.5 21 11.5Z" fill="white"/>
                      <path d="M3 11.5C3.82843 11.5 4.5 10.8284 4.5 10C4.5 9.17157 3.82843 8.5 3 8.5C2.17157 8.5 1.5 9.17157 1.5 10C1.5 10.8284 2.17157 11.5 3 11.5Z" fill="white"/>
                      <path d="M12 22.5C12.8284 22.5 13.5 21.8284 13.5 21C13.5 20.1716 12.8284 19.5 12 19.5C11.1716 19.5 10.5 20.1716 10.5 21C10.5 21.8284 11.1716 22.5 12 22.5Z" fill="white"/>
                      <path d="M12 4.5C12.8284 4.5 13.5 3.82843 13.5 3C13.5 2.17157 12.8284 1.5 12 1.5C11.1716 1.5 10.5 2.17157 10.5 3C10.5 3.82843 11.1716 4.5 12 4.5Z" fill="white"/>
                      <path d="M18.4501 18.9502C19.2785 18.9502 19.9501 18.2786 19.9501 17.4502C19.9501 16.6217 19.2785 15.9502 18.4501 15.9502C17.6217 15.9502 16.9501 16.6217 16.9501 17.4502C16.9501 18.2786 17.6217 18.9502 18.4501 18.9502Z" fill="white"/>
                      <path d="M5.54993 18.9502C6.37836 18.9502 7.04993 18.2786 7.04993 17.4502C7.04993 16.6217 6.37836 15.9502 5.54993 15.9502C4.7215 15.9502 4.04993 16.6217 4.04993 17.4502C4.04993 18.2786 4.7215 18.9502 5.54993 18.9502Z" fill="white"/>
                      <path d="M18.4501 4.04993C19.2785 4.04993 19.9501 3.37836 19.9501 2.54993C19.9501 1.7215 19.2785 1.04993 18.4501 1.04993C17.6217 1.04993 16.9501 1.7215 16.9501 2.54993C16.9501 3.37836 17.6217 4.04993 18.4501 4.04993Z" fill="white"/>
                      <path d="M5.54993 4.04993C6.37836 4.04993 7.04993 3.37836 7.04993 2.54993C7.04993 1.7215 6.37836 1.04993 5.54993 1.04993C4.7215 1.04993 4.04993 1.7215 4.04993 2.54993C4.04993 3.37836 4.7215 4.04993 5.54993 4.04993Z" fill="white"/>
                    </svg>
                  </span>
                  <span className="badge-text">Enchères en Direct</span>
                </div>
                <div className="badge">
                  <span className="badge-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17.5 15V18.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 17.5H20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 8.5H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6.5V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 14H16C14.9 14 14 14.9 14 16V19C14 20.1 14.9 21 16 21H19C20.1 21 21 20.1 21 19V16C21 14.9 20.1 14 19 14Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="badge-text">Placez des Enchères</span>
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