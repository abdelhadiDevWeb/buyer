import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mazad.app',
  appName: 'Mazad Click',
  webDir: 'public',
    "server": {
    "url": "https://buyer-mazad.vercel.app/",
    "cleartext": false
  }
};

export default config;
