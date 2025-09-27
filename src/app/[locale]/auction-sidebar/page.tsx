"use client";

import MultipurposeAuctionSidebar from "@/components/auction-sidebar/MultipurposeAuctionSidebar";
import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import Chat from "@/chat/Chat";
import InteractiveBackground from "@/components/common/InteractiveBackground";

const AuctionSidebarPage = () => {
  const { initializeAuth } = useAuth();
  const [show, setShow] = useState(false);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
      <style jsx global>{`
        /* Global styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        :root {
          --primary-color: #0063b1;
          --secondary-color: #FFA500;
          --text-color: #333;
          --bg-color: #fff;
          --accent-color: #f5f5f5;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
          --transition: all 0.3s ease;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.5;
          color: var(--text-color);
          background: transparent;
          overflow-x: hidden;
        }
        
        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        section {
          padding: 40px 0;
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
          margin-bottom: 40px;
        }
        
        .text-gradient {
          background: #0063b1;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          transition: var(--transition);
          cursor: pointer;
          border: none;
        }
        
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        
        .btn-primary {
          background: #0063b1;
          color: white;
        }
        
        .btn-light {
          background: white;
          color: var(--text-color);
        }
        
        .card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }
        
        .card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-5px);
        }
        
        /* Auction page specific styles */
        .auction-sidebar {
          transition: var(--transition);
        }
        
        .auction-card {
          transition: var(--transition);
        }
        
        .auction-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        
        .countdown-timer ul {
          display: flex;
          justify-content: space-between;
        }
        
        .widget-title {
          font-weight: 600;
        }
        
        .search-box input:focus {
          outline: none;
          border-color: #0063b1;
          box-shadow: 0 0 0 3px rgba(0, 99, 177, 0.2);
        }
        
        .checkbox-container label:hover {
          color: var(--secondary-color);
        }
        
        /* Category buttons */
        .categories-filter button {
          transition: var(--transition);
        }
        
        .categories-filter button:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 6px rgba(0, 99, 177, 0.2);
        }
        
        /* Spinner animation */
        .spinner {
          animation: spin 1s linear infinite;
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
              <main style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
                <section className="animate-fade-in">
                  <MultipurposeAuctionSidebar />
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

export default AuctionSidebarPage;
