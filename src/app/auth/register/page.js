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
  const [hasTermsAvailable, setHasTermsAvailable] = useState(true);
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

  // Lightweight availability check for terms content from backend
  useEffect(() => {
    const checkTermsAvailability = async () => {
      try {
        const terms = await TermsAPI.getLatest();
        const termsData = terms?.data || terms;

        if (termsData) {
          if (Array.isArray(termsData)) {
            const first = termsData[0];
            setHasTermsAvailable(!!(first && (first.content || first.description || first.text)));
          } else {
            setHasTermsAvailable(!!(termsData.content || termsData.description || termsData.text));
          }
        } else {
          setHasTermsAvailable(false);
        }
      } catch (err) {
        console.warn('Terms availability check failed:', err?.message);
        setHasTermsAvailable(false);
      }
    };

    checkTermsAvailability();
  }, []);

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
          <h2 style="color: #FFD700; margin-bottom: 16px;">${title}</h2>
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
            <h2 style="color: #FFD700; margin-bottom: 16px;">${title}</h2>
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
    if (hasTermsAvailable && !termsAccepted) {
      setSnackbarMessage("Vous devez accepter les termes et conditions pour continuer");
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
        setSnackbarMessage("Inscription réussie! Redirection vers la vérification OTP...");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // Redirect to seller app OTP verification page
        setTimeout(() => {
          const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
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
        setSnackbarMessage("Inscription réussie! Redirection vers la vérification OTP...");
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
        setSnackbarMessage("Inscription réussie! Connexion en cours...");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // If no verification required, redirect to dashboard after delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      else {
        console.error('Invalid response structure:', responseData);
        setSnackbarMessage("Inscription réussie mais réponse inattendue du serveur.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Une erreur inattendue s'est produite lors de l'inscription.";
      
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
              <h1>Créer un Compte</h1>
              <p>Inscrivez-vous pour commencer avec MazadClick</p>
            </div>

            <div className="auth-form">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="firstname">Prénom</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      id="firstname"
                      type="text"
                      placeholder="Votre prénom"
                      name="firstname"
                      value={data.firstname}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
                <div className="form-group half">
                  <label htmlFor="lastname">Nom</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      id="lastname"
                      type="text"
                      placeholder="Votre nom"
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
                  <label htmlFor="phone">Numéro de Téléphone</label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" />
                    <input
                      id="phone"
                      type="text"
                      placeholder="Votre numéro"
                      name="phone"
                      value={data.phone}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
                <div className="form-group half">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Votre adresse email"
                      name="email"
                      value={data.email}
                      onChange={changeData}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Genre</label>
                <div className="input-wrapper">
                  <FiUsers className="input-icon" />
                  <select
                    id="gender"
                    name="gender"
                    value={data.gender}
                    onChange={changeData}
                    className="select-input"
                  >
                    <option value="" disabled>Sélectionnez votre genre</option>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Créez un mot de passe fort"
                    name="password"
                    value={data.password}
                    onChange={changeData}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              {/* Terms and Conditions Section - Modern UI (conditionally rendered) */}
              {hasTermsAvailable && (
              <div className="terms-card">
                <div className="terms-card-header">
                  <div className="terms-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 21H16C17.657 21 19 19.657 19 18V7.828C19 7.298 18.789 6.789 18.414 6.414L15.586 3.586C15.211 3.211 14.702 3 14.172 3H8C6.343 3 5 4.343 5 6V18C5 19.657 6.343 21 8 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="terms-card-title">Termes et confidentialité</div>
                    <div className="terms-card-subtitle">Veuillez lire et accepter pour continuer</div>
                  </div>
                </div>

                <label htmlFor="termsAccepted" className="terms-row">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    className="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <div className="terms-text">
                    J'ai lu et j'accepte les{' '}
                    <button type="button" className="terms-link" onClick={handleOpenTerms}>
                      termes et conditions d'utilisation
                    </button>{' '}
                    ainsi que la{' '}
                    <button type="button" className="terms-link" onClick={handleOpenTerms}>
                      politique de confidentialité
                    </button>
                    .
                  </div>
                </label>

                {!termsAccepted && (
                  <div className="terms-warning" role="alert">
                    <FiAlertCircle className="warning-icon" />
                    <span>Vous devez accepter les termes et conditions pour continuer</span>
                  </div>
                )}
              </div>
              )}

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
                  <span>{loading ? "Inscription en cours..." : "Inscrire"}</span>
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
            <div className="decoration-content">
              <h2>Rejoignez notre Communauté d'Enchères</h2>
              <p>Découvrez des produits uniques et participez aux enchères en direct.</p>
              <div className="decoration-badges">
                <div className="badge">
                  <span className="badge-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.06 18.67L16.92 14.4L14.78 18.67M8.5 11L6.36 6.73L4.22 11M2 9V4C2 3.45 2.45 3 3 3H11C11.55 3 12 3.45 12 4V9C12 9.55 11.55 10 11 10H3C2.45 10 2 9.55 2 9ZM12 20V15C12 14.45 12.45 14 13 14H21C21.55 14 22 14.45 22 15V20C22 20.55 21.55 21 21 21H13C12.45 21 12 20.55 12 20Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="badge-text">Prix Attractifs</span>
                </div>
                <div className="badge">
                  <span className="badge-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.18 10.16 8.49 10.96 8.49H12.84C13.76 8.49 14.51 9.27 14.51 10.24M12 7.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 3V7H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L17 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="badge-text">Transactions Sécurisées</span>
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
          Termes et Conditions d'Utilisation
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
                  Chargement des termes...
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
                  Impossible de charger les termes et conditions. Veuillez réessayer.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', gap: '8px' }}>
          <Button onClick={handleCloseTerms} variant="contained">
            Fermer
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