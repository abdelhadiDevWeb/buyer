const app = {
  name: 'MazadClick',
  pole: 'NotEasy',
  timeout: 15000,
  domain: 'www.mazadclick.com',
  // route: 'https://api.easyeats.dz/static/',
  // baseURL: 'https://api.easyeats.dz/v1/',
  // socket: 'wss://api.easyeats.dz/',

  socket: 'https://mazad-click-server.onrender.com/',
  route: "https://mazad-click-server.onrender.com",
  baseURL: "https://mazad-click-server.onrender.com/",
  imageBaseURL: "https://mazad-click-server.onrender.com/static",

  // socket: 'http://localhost:3001/',
  // route: "http://localhost:3001/",
  // baseURL: "http://localhost:3001/",

  apiKey: '8f2a61c94d7e3b5f9c0a8d2e6b4f1c7a',
};

export const API_BASE_URL = app.baseURL;

export default app;
