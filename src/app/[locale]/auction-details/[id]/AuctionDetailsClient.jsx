"use client";
import React from "react";
import MultipurposeDetails1 from "@/components/auction-details/MultipurposeDetails1";
import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import SocketProvider from "@/contexts/socket";
import Chat from "@/chat/Chat";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#666',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Une erreur s'est produite</h2>
            <p style={{ marginBottom: '20px' }}>
              Désolé, une erreur inattendue s'est produite lors du chargement de cette page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#0063b1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AuctionDetailsClient({ params }) {
  const { initializeAuth, isReady } = useAuth();
  const [show, setShow] = useState(false);
  const [check, setCheck] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      initializeAuth();
      // Log params for debugging
      console.log("Auction Details Client Params:", params);
    } catch (error) {
      console.error("Error in AuctionDetailsClient:", error);
      setHasError(true);
    }
  }, [initializeAuth, params]);

  if (hasError) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Erreur de chargement</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#0063b1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px'
          }}></div>
          <p>Chargement...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Global styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          background-color: #fff;
          overflow-x: hidden;
        }
        
        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        section {
          padding: 20px 0;
        }
        
        /* Animation Keyframes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(0, 99, 177, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Utility classes */
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .section-spacing {
          margin-bottom: 100px;
        }
        
        .text-gradient {
          background: #0063b1;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
      `}</style>
      
      <ErrorBoundary>
        <div className={`${show && 'AllPages'}`}>
          {show && <Chat setShow={setShow} check={check} setCheck={setCheck}/>}
          <SnackbarProvider 
            maxSnack={3} 
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            style={{ borderRadius: '10px' }}
          >
            <RequestProvider>
              <AxiosInterceptor>
                <Header />
                <main style={{ minHeight: '100vh', backgroundColor: '#fff', marginTop: 0, paddingTop: 0 }}>
                  <section className="animate-fade-in" style={{ padding: 0, marginTop: 0 }}>
                    <MultipurposeDetails1 params={params} />
                  </section>
                </main>
                <Footer />
              </AxiosInterceptor>
            </RequestProvider>
          </SnackbarProvider>
        </div>
      </ErrorBoundary>
    </>
  );
} 