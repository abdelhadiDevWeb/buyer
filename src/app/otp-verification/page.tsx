"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Snackbar, Alert } from "@mui/material";
import useAuth from "@/hooks/useAuth";

function OTPVerificationContent() {
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { set } = useAuth();

  const phone = searchParams.get("phone") || "";
  const fromBuyer = searchParams.get("fromBuyer");

  // Animation sequence on mount
  useEffect(() => {
    const sequence = [
      () => setAnimationStep(1), // Header animation
      () => setAnimationStep(2), // Form animation
      () => setAnimationStep(3), // Complete animation
    ];

    sequence.forEach((step, index) => {
      setTimeout(step, index * 300);
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Check if OTP is complete
  useEffect(() => {
    const otpString = otp.join("");
    setIsComplete(otpString.length === 5);
  }, [otp]);

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSnackbarClose = (event: any, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    if (/^\d{5}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
      inputRefs.current[4]?.focus();
      setFocusedIndex(4);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

      if (otpCode.length !== 5) {
      setSnackbarMessage("Veuillez entrer le code complet.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSnackbarMessage("OTP verified successfully! Logging you in...");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        // If the response includes user and token data, authenticate the user
        if (data.data && data.data.user) {
          const authData = {
            user: data.data.user,
            tokens: {
              accessToken: data.data.access_token || data.data.session?.access_token,
              refreshToken: data.data.refresh_token || data.data.session?.refresh_token,
            },
          };
          set(authData);
          
          // Redirect to home page
        setTimeout(() => {
            router.push("/");
          }, 1500);
      } else {
          // If no auth data returned, redirect to login
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      } else {
        throw new Error(data.message || "Code OTP invalide.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setSnackbarMessage((error as any).message || "Erreur lors de la vérification du code.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);

      setOtp(["", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);

      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSnackbarMessage("New OTP code sent successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setTimeLeft(300);
        setCanResend(false);
        setOtp(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
      } else {
        throw new Error(data.message || "Erreur lors de l'envoi du code.");
      }
    } catch (error) {
      console.error("OTP resend error:", error);
      setSnackbarMessage((error as any).message || "Erreur lors du renvoi du code.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isComplete) {
      handleVerifyOTP();
    }
  };

  const maskPhone = (phoneNumber: string) => {
    if (!phoneNumber) return "";
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 3)}****${cleaned.slice(-2)}`;
    }
    return phoneNumber;
  };

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* Modern Animation Keyframes */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(0, 99, 177, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafe 50%, #f0f4ff 100%);
          position: relative;
          overflow: hidden;
        }

        /* Header Styles */
        .modern-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 99, 177, 0.1);
          transition: all 0.3s ease;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-logo {
          height: 40px;
          width: auto;
          transition: all 0.3s ease;
        }

        .header-nav {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .header-link {
          color: #333;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          position: relative;
        }

        .header-link:hover {
          color: #0063b1;
          background: rgba(0, 99, 177, 0.05);
        }

        /* Background Elements */
        .background-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 99, 177, 0.03) 0%, transparent 70%);
          animation: float 8s ease-in-out infinite;
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          top: 20%;
          right: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 200px;
          height: 200px;
          bottom: 20%;
          left: 15%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 20%;
          animation-delay: 4s;
        }

        /* Main Content */
        .main-content {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem 2rem;
        }

        .verification-container {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.08);
          border: 1px solid rgba(0, 99, 177, 0.1);
          overflow: hidden;
          max-width: 500px;
          width: 100%;
          position: relative;
        }

        .verification-header {
          background: linear-gradient(135deg, #0063b1 0%, #00a3e0 100%);
          color: white;
          padding: 3rem 2rem 2rem;
          text-align: center;
          position: relative;
        }

        .header-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          backdrop-filter: blur(10px);
          animation: pulse 2s infinite;
        }

        .verification-title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .verification-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 1rem;
        }

        .phone-display {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        /* Form Section */
        .verification-form {
          padding: 2.5rem 2rem;
        }

        .timer-section {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .timer-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          animation: pulse 2s infinite;
        }

        .otp-section {
          margin-bottom: 2rem;
        }

        .otp-label {
          text-align: center;
          font-weight: 600;
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .otp-inputs {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .otp-input-container {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .otp-input {
          width: 100%;
          height: 100%;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          border: 2px solid #e1e5e9;
          border-radius: 16px;
          background: #f8f9fa;
          color: #1a202c;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .otp-input:focus {
          border-color: #0063b1;
          background: white;
          box-shadow: 0 0 0 4px rgba(0, 99, 177, 0.1);
          transform: scale(1.05);
        }

        .otp-input.filled {
          border-color: #10b981;
          background: #f0fdf4;
          color: #059669;
        }

        .success-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          animation: scaleIn 0.3s ease-out;
        }

        .progress-indicator {
          height: 4px;
          background: #e1e5e9;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0063b1, #00a3e0);
          border-radius: 2px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Action Buttons */
        .verify-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(90deg, #0063b1, #00a3e0);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .verify-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .verify-button.complete {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .verify-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 99, 177, 0.3);
        }

        .verify-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .verify-button:hover::before {
          left: 100%;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .resend-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .resend-text {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .resend-button {
          background: none;
          border: 2px solid #e1e5e9;
          color: #666;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          transition: all 0.3s ease;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .resend-button.active {
          border-color: #0063b1;
          color: #0063b1;
        }

        .resend-button.active:hover {
          background: rgba(0, 99, 177, 0.05);
          transform: translateY(-1px);
        }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #666;
          text-decoration: none;
          font-weight: 500;
          padding: 0.75rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .back-link:hover {
          background: #f8f9fa;
          color: #333;
        }

        /* Animations */
        .animate-in-1 {
          opacity: 0;
          transform: translateY(30px);
          animation: slideInUp 0.6s ease-out 0.1s forwards;
        }

        .animate-in-2 {
          opacity: 0;
          transform: translateY(30px);
          animation: slideInUp 0.6s ease-out 0.3s forwards;
        }

        .animate-in-3 {
          opacity: 0;
          transform: translateY(30px);
          animation: slideInUp 0.6s ease-out 0.5s forwards;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-content {
            padding: 5rem 1rem 1rem;
          }

          .verification-header {
            padding: 2rem 1.5rem 1.5rem;
          }

          .verification-title {
            font-size: 1.5rem;
          }

          .verification-form {
            padding: 2rem 1.5rem;
          }

          .otp-inputs {
            gap: 0.75rem;
          }

          .otp-input-container {
            width: 50px;
            height: 50px;
          }

          .otp-input {
            font-size: 1.25rem;
          }

          .header-nav {
            display: none;
          }
        }
      `}</style>

      <div className="page-container">
        {/* Modern Header */}
        <header className="modern-header">
          <div className="header-content">
            <Link href="/">
              <img
                src="/assets/images/logo-dark.png"
                alt="MazadClick Logo"
                className="header-logo"
              />
            </Link>
            <nav className="header-nav">
              <Link href="/" className="header-link">Home</Link>
              <Link href="/auth/login" className="header-link">Login</Link>
              <Link href="/auth/register" className="header-link">Register</Link>
            </nav>
          </div>
        </header>

        {/* Background Elements */}
        <div className="background-elements">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        {/* Main Content */}
        <main className="main-content">
          <div className={`verification-container ${animationStep >= 1 ? 'animate-in-1' : ''}`}>
            {/* Header Section */}
            <div className="verification-header">
              <div className="header-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L15.09 8.26L23 9L17 14.74L18.18 22.5L12 19.77L5.82 22.5L7 14.74L1 9L8.91 8.26L12 1Z"/>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1 className="verification-title">Security Verification</h1>
              <p className="verification-subtitle">
                We've sent a verification code to
              </p>
              <div className="phone-display">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>{maskPhone(phone)}</span>
              </div>
            </div>

            {/* Form Section */}
            <div className={`verification-form ${animationStep >= 2 ? 'animate-in-2' : ''}`}>
              {/* Timer */}
              <div className="timer-section">
                <div className="timer-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* OTP Input Section */}
              <div className="otp-section">
                <div className="otp-label">Enter 5-digit verification code</div>
                
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <div key={index} className="otp-input-container">
                      <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setFocusedIndex(index)}
                        className={`otp-input ${digit ? 'filled' : ''}`}
                      />
                      {digit && (
                        <div className="success-indicator">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="progress-indicator">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(otp.filter(d => d).length / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`${animationStep >= 3 ? 'animate-in-3' : ''}`}>
                <button
                  className={`verify-button ${isComplete ? 'complete' : ''}`}
                  onClick={handleVerifyOTP}
                  disabled={loading || !isComplete}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      <span>Verify Code</span>
                    </>
                  )}
                </button>

                <div className="resend-section">
                  <p className="resend-text">Didn't receive the code?</p>
                  <button
                    onClick={handleResendOTP}
                    disabled={!canResend || resendLoading}
                    className={`resend-button ${canResend ? 'active' : ''}`}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      style={{ 
                        animation: resendLoading ? 'spin 1s linear infinite' : 'none' 
                      }}
                    >
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    <span>
                      {resendLoading
                ? "Envoi..."
                : canResend
                        ? "Renvoyer le code"
                        : `Renvoyer dans ${formatTime(timeLeft)}`}
                    </span>
                  </button>
                </div>

                <Link href="/auth/register" className="back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                  <span>Back to Registration</span>
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity as any}
            sx={{
              width: "100%",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
    </div>
    </>
  );
}

export default function OTPVerification() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPVerificationContent />
    </Suspense>
  );
}
