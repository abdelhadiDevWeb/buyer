import React, { useEffect, ReactNode } from 'react';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';

interface AxiosInterceptorProps {
  children: ReactNode;
}

export const AxiosInterceptor: React.FC<AxiosInterceptorProps> = ({ children }) => {
  const { auth, set } = useAuth();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          // Clear auth data
          set({ tokens: undefined, user: undefined });
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [set]);

  // Add token to requests if available
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        if (auth?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [auth?.tokens?.accessToken]);

  return <>{children}</>;
}; 