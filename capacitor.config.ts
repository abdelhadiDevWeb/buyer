import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazadclick.buyer',
  appName: 'Buyer',
  webDir: 'www', // حط أي مجلد (حتى لو مش موجود، Capacitor يتعامل معاه)
  server: {
    url: 'https://mazad-click-buyer.vercel.app', // رابطك على Vercel
    cleartext: false, // لازم HTTPS على Android/iOS
  },
};

export default config;
