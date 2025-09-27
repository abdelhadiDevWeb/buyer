"use client";
import { useEffect, ReactNode } from "react";
import "../../public/assets/css/bootstrap-icons.css";
import "../../public/assets/css/boxicons.min.css";
import "../../public/assets/css/swiper-bundle.min.css";
import "../../public/assets/css/slick-theme.css";
import "../../public/assets/css/animate.min.css";
import "../../public/assets/css/nice-select.css";
import "../../public/assets/css/slick.css";
import "../../public/assets/css/bootstrap.min.css";
import "../../public/assets/css/style.css";
import "./rtl.css";
import "../styles/rtl.css";

import ScrollTopBtn from "../components/common/ScrollTopBtn.jsx";
import useWow from "@/customHooks/useWow";
import { dmsans, playfair_display } from "@/fonts/font";

import { authStore } from "@/contexts/authStore";
import { AxiosInterceptor } from "@/app/api/AxiosInterceptor";

import { SnackbarProvider } from "@/contexts/snackbarContext";
import SocketProvider from "@/contexts/socket";
import FloatingAdminChat from "@/components/FloatingAdminChat";
import GlobalLoader from "@/components/common/GlobalLoader";
import InteractiveBackground from "@/components/common/InteractiveBackground";
import BidChecker from "@/components/BidChecker";
// Multilanguage removed

export default function RootLayout({ children }: { children: ReactNode }) {
  // --- Hooks must be called inside the component function body ---
  
  // Custom hook for WOW.js animations
  useWow();

  // useEffect for initializing authentication state
  useEffect(() => {
    // Initialize auth store on app load
    authStore.getState().initializeAuth();
  }, []);

  // --- The return statement provides the component's UI ---
  return (
    <html
      lang="fr"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      // Prop to prevent hydration errors from browser extensions
      suppressHydrationWarning={true}
    >
      <head>
        <link
          rel="icon"
          href="/assets/img/fav-icon.svg"
          type="image/x-icon"
          sizes="16x16"
        />
        <meta name="description" content="Plateforme d'enchères professionnelle MazadClick" />
        <meta name="keywords" content="enchères, ventes aux enchères, MazadClick, acheteur" />
        <title>MazadClick - Acheteur</title>
      </head>
      <body>
            <AxiosInterceptor>
              <SocketProvider>
                <SnackbarProvider>
                  <InteractiveBackground 
                    theme="light" 
                    enableDots={true}
                    enableGeometry={true}
                    enableWaves={true}
                    enableMouseTrail={true}
                    particleCount={50}
                  />
                  <GlobalLoader />
                  <BidChecker />
                  {children}
                  <ScrollTopBtn />
                  <FloatingAdminChat />
                </SnackbarProvider>
              </SocketProvider>
            </AxiosInterceptor>
      </body>
    </html>
  );
}