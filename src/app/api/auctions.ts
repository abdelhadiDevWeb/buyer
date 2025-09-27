
// app/api/auctions.ts
import axios, { AxiosResponse } from 'axios';
import app from '@/config';

// Create a dedicated axios instance for auctions
const auctionInstance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

// Helper function to extract response body
const responseBody = (res: AxiosResponse) => res.data;

// Add request interceptor to include auth token if available
auctionInstance.interceptors.request.use((config) => {
  // Try to get auth token from localStorage or session
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const auth = JSON.parse(authData);
      if (auth?.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
      }
    }
  } catch (error) {
    console.warn('Could not add auth token to request:', error);
  }
  
  return config;
});

// Add response interceptor for better error handling
auctionInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    // Enhance error object with more context
    error.apiContext = {
      baseURL: app.baseURL,
      endpoint: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    };
    
    throw error;
  }
);

interface Auction {
  id: string;
  title: string;
  description?: string;
  startingPrice: number;
  currentPrice: number;
  endTime: string;
  status: string;
  images?: string[];
  sellerId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  isPro?: boolean; // Professional auction flag
  hidden?: boolean; // Anonymous seller flag
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AuctionsAPI = {
  getAuctions: async (): Promise<ApiResponse<Auction[]>> => {
    try {
      console.log('Fetching auctions from:', `${app.baseURL}/bid`);
      const response = await auctionInstance.get('bid');
      console.log('Auctions fetched successfully:', response.data);
      return responseBody(response);
    } catch (error: any) {
      console.error('Error fetching auctions:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Request error:', {
          message: error.message,
          code: error.code,
          config: error.config
        });
      } else {
        console.error('Other error:', error.message);
      }
      
      throw error;
    }
  },
  
  getAuctionById: async (id: string): Promise<ApiResponse<Auction>> => {
    try {
      if (!id) {
        throw new Error('Auction ID is required');
      }
      
      console.log('Fetching auction by ID:', id);
      console.log('Full URL:', `${app.baseURL}bid/${id}`);
      
      const response = await auctionInstance.get(`bid/${id}`);
      console.log('Auction fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      return responseBody(response);
    } catch (error: any) {
      console.error('Error fetching auction by ID:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Request error:', {
          message: error.message,
          code: error.code,
          config: error.config
        });
      } else {
        console.error('Other error:', error.message);
      }

      throw error;
    }
  },
};