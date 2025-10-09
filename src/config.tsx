const app = {
  name: 'MazadClick',
  pole: 'NotEasy',
  timeout: 15000,
  domain: 'www.mazadclick.com',
  // route: 'https://api.easyeats.dz/static/',
  // baseURL: 'https://api.easyeats.dz/v1/',
  // socket: 'wss://api.easyeats.dz/',

  // socket: 'http://localhost:3000/',
  // route: "http://localhost:3000",
  // baseURL: "http://localhost:3000/",

  socket: 'http://localhost:3000/',
  route: "http://localhost:3000/static/",
  baseURL: "http://localhost:3000/",

  // Frontend URLs - Dynamic based on environment
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buyer-mazad.vercel.app',
  frontendPort: process.env.NODE_ENV === 'development' ? ':3001' : '',

  // Seller Application URL - Dynamic based on environment
  sellerUrl: process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3002/',

  apiKey: '64d2e8b7c3a9f1e5d8b2a4c6e9f0d3a5',
};

export const API_BASE_URL = app.baseURL;

// Helper function to get the full frontend URL
export const getFrontendUrl = (): string => {
  // let a = "development" ;
  // if (a === 'development') {
  //   return `http://localhost:3001`;
  // }
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:3001`;
  }
  return app.frontendUrl;
};

// Helper function to get frontend URL for redirects
export const getFrontendBaseUrl = (): string => {
  return getFrontendUrl();
};

// Helper function to get the seller URL
export const getSellerUrl = (): string => {
  return app.sellerUrl;
};

export default app;
