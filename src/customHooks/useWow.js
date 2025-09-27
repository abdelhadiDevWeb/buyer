"use client";
import { useEffect, useRef } from "react";

const useWow = () => {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) {
      return;
    }

    const initWow = () => {
      // Only run in browser environment
      if (typeof window === "undefined") {
        return;
      }

      // Check if WOW is already available globally
      if (window.WOW && typeof window.WOW === 'function') {
        console.log('WOW.js already available globally');
        initializeWowInstance(window.WOW);
        return;
      }

      // Load from CDN (more reliable than npm package)
      loadWowFromCDN();
    };

    const initializeWowInstance = (WOWConstructor) => {
      try {
        const wow = new WOWConstructor({
          boxClass: "wow",
          animateClass: "animated",
          offset: 80,
          mobile: true,
          live: false,
        });
        
        wow.init();
        console.log('WOW.js initialized successfully');
        initialized.current = true;
        
      } catch (error) {
        console.error('Error creating WOW instance:', error);
      }
    };
    
    const loadWowFromCDN = () => {
      if (typeof window !== 'undefined' && !window.WOW) {
        console.log('Loading WOW.js from CDN...');
        
        // Check if script is already loaded
        const existingScript = document.querySelector('script[src*="wow"]');
        if (existingScript) {
          console.log('WOW.js script already exists');
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js';
        script.async = true;
        
        script.onload = () => {
          if (window.WOW && typeof window.WOW === 'function') {
            try {
              initializeWowInstance(window.WOW);
            } catch (error) {
              console.error('Error initializing WOW.js from CDN:', error);
            }
          } else {
            console.error('WOW.js not available from CDN');
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load WOW.js from CDN');
        };
        
        document.head.appendChild(script);
      }
    };
    
    if (typeof window !== "undefined") {
      // Small delay to ensure DOM is ready
      setTimeout(initWow, 100);

      // This logic helps re-sync animations on route changes. It's good to keep.
      const handleRouteChange = () => {
        if (typeof window.WOW !== "undefined" && window.WOW.sync) {
          // Re-initialize animations for new elements on the page
          window.WOW.sync();
        }
      };

      // Listen for route changes
      document.addEventListener("routeChangeComplete", handleRouteChange);

      // Cleanup listener on component unmount
      return () => {
        document.removeEventListener("routeChangeComplete", handleRouteChange);
      };
    }
  }, []); // Empty dependency array ensures this runs only once per component mount.
};

export default useWow;