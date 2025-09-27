"use client";
import { useState, useEffect } from 'react';

/**
 * Custom hook to handle page overlay
 * @param {boolean} initialState - Initial overlay state
 * @returns {[boolean, function, function]} - Overlay state, show function, hide function
 */
const useOverlay = (initialState = false) => {
  const [isOverlayActive, setIsOverlayActive] = useState(initialState);
  
  const showOverlay = () => {
    setIsOverlayActive(true);
    // Add class to body to prevent scrolling
    document.body.style.overflow = 'hidden';
  };
  
  const hideOverlay = () => {
    setIsOverlayActive(false);
    // Re-enable scrolling
    document.body.style.overflow = '';
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  return [isOverlayActive, showOverlay, hideOverlay];
};

export default useOverlay; 