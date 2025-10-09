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

import ScrollTopBtn from "../components/common/ScrollTopBtn.jsx";
import useWow from "@/customHooks/useWow";
import { dmsans, playfair_display } from "@/fonts/font";

import { authStore } from "@/contexts/authStore";
import { AxiosInterceptor } from "@/app/api/AxiosInterceptor";

import { SnackbarProvider } from "@/contexts/snackbarContext";
import SocketProvider from "@/contexts/socket";
import FloatingAdminChat from "@/components/FloatingAdminChat";
import FloatingLanguageSwitcher from "@/components/FloatingLanguageSwitcher";
import { LanguageProvider } from "@/contexts/LanguageContext";
import I18nProvider from "@/components/I18nProvider";
import GlobalLoader from "@/components/common/GlobalLoader";
import InteractiveBackground from "@/components/common/InteractiveBackground";
import BidChecker from "@/components/BidChecker";
import WinnerAnnouncement from "@/components/WinnerAnnouncement";
import TokenHandler from "@/app/components/TokenHandler";

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
      lang="en"
      className={`${playfair_display.variable} ${dmsans.variable}`}
      // Prop to prevent hydration errors from browser extensions
      suppressHydrationWarning={true}
    >
      <head>
        <link
          rel="icon"
          href="/assets/img/logo.png"
          type="image/jpeg"
          sizes="16x16 32x32"
        />
        <meta name="description" content="Your description here" />
        <meta name="keywords" content="next.js, SEO, meta tags" />
        <title>MazadClick-Buyer</title>
      </head>
      <body>
        <I18nProvider>
          <LanguageProvider>
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
                  <TokenHandler>
                    <GlobalLoader />
                    <BidChecker />
                    <WinnerAnnouncement />
                    {children}
                  </TokenHandler>
                  <ScrollTopBtn />
                  <FloatingAdminChat />
                  <FloatingLanguageSwitcher />
                </SnackbarProvider>
              </SocketProvider>
            </AxiosInterceptor>
          </LanguageProvider>
        </I18nProvider>
      </body>
    </html>
  );
}