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

  socket: 'https://mazadclick-server.onrender.com',
  route: "https://mazadclick-server.onrender.com",
  baseURL: "https://mazadclick-server.onrender.com",

  // Frontend URLs - Dynamic based on environment
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buyer-mazad.vercel.app',
  frontendPort: process.env.NODE_ENV === 'development' ? ':3001' : '',

  apiKey: '8f2a61c94d7e3b5f9c0a8d2e6b4f1c7a',
};

export const API_BASE_URL = app.baseURL;

// Helper function to get the full frontend URL
export const getFrontendUrl = (): string => {
  let a = "development" ;
  if (a === 'development') {
    return `http://localhost:3001`;
  }
  // if (process.env.NODE_ENV === 'development') {
  //   return `http://localhost:3001`;
  // }
  return app.frontendUrl;
};

// Helper function to get frontend URL for redirects
export const getFrontendBaseUrl = (): string => {
  return getFrontendUrl();
};

export default app;
