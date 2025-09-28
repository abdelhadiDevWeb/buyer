import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@assets': path.resolve(__dirname, 'public/assets'),
    };

    // Only apply fallbacks in production builds, not in development
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
  
  // Improve performance
  compress: true,
  poweredByHeader: false,
  
  // React compatibility - enable strict mode for better error detection
  reactStrictMode: true,
  
  // Remove standalone output for development (only for production builds)
  // output: 'standalone',
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    // Add legacy browser support
    legacyBrowsers: false,
  },
  
  // Development configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Improve error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // External packages
  serverExternalPackages: ['critters', 'react-i18next', 'i18next'],
};

export default nextConfig; 