import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mazad.app',
  appName: 'Mazad Click',
  webDir: 'public',
    "server": {
    "url": "https://buyer-mazad.vercel.app/mobile",
    "cleartext": false
  }
};

export default config;
