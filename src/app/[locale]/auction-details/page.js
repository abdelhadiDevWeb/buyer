"use client";

import MultipurposeDetails1 from "@/components/auction-details/MultipurposeDetails1";
import Footer from "@/components/footer/FooterWithErrorBoundary";
import Header from "@/components/header/Header";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import Chat from "@/chat/Chat";

const AuctionDetailsPage = ({ searchParams }) => {
  // Authentication and chat state setup
  const { initializeAuth } = useAuth();
  const [show, setShow] = useState(false);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    initializeAuth();
    // Log search parameters for debugging
    console.log("Auction Details Page Search Params:", searchParams);
  }, [searchParams, initializeAuth]);

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
          padding: 0;
        }
        
        /* Animation Keyframes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
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
          background: linear-gradient(90deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
      `}</style>
      
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
                  <MultipurposeDetails1 />
                </section>
              </main>
              <Footer />
            </AxiosInterceptor>
          </RequestProvider>
        </SnackbarProvider>
      </div>
    </>
  );
};

export default AuctionDetailsPage;
