// Test utility for WOW.js CDN functionality
export const testWowCDN = () => {
  console.log('=== WOW.js CDN Test ===');
  
  if (typeof window === 'undefined') {
    console.log('❌ Window not available (server-side)');
    return false;
  }
  
  // Check if WOW.js is already loaded
  if (window.WOW) {
    console.log('✅ WOW.js already available globally');
    console.log('WOW type:', typeof window.WOW);
    return true;
  }
  
  // Check if WOW.js script is already in DOM
  const existingScript = document.querySelector('script[src*="wow"]');
  if (existingScript) {
    console.log('✅ WOW.js script already exists in DOM');
    console.log('Script src:', existingScript.src);
    return true;
  }
  
  console.log('ℹ️ WOW.js not loaded yet, will be loaded from CDN');
  return false;
};

// Test WOW.js initialization
export const testWowInit = () => {
  try {
    if (typeof window === 'undefined') {
      console.log('❌ Window not available (server-side)');
      return false;
    }
    
    if (!window.WOW) {
      console.log('❌ WOW.js not available globally');
      return false;
    }
    
    if (typeof window.WOW !== 'function') {
      console.log('❌ WOW is not a function');
      return false;
    }
    
    console.log('✅ WOW.js is available and is a function');
    return true;
  } catch (error) {
    console.error('❌ WOW.js initialization test failed:', error);
    return false;
  }
};
