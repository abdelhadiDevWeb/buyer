
import { requests } from "./utils";

interface Offer {
  id: string;
  amount: number;
  auctionId: string;
  bidderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOfferData {
  price: number;
  user: string;
  owner: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const OfferAPI = {
  getOffers: async (): Promise<ApiResponse<Offer[]>> => {
    try {
      const res = await requests.get('offers');
      if ('success' in res) {
        return res as ApiResponse<Offer[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Offer[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  sendOffer: async (tenderId: string, offerData: CreateOfferData): Promise<ApiResponse<Offer>> => {
    try {
      console.log('Sending offer for tender:', tenderId, 'with data:', offerData);
      const res = await requests.post(`offers/${tenderId}`, offerData);
      console.log('Offer API response:', res);
      if ('success' in res) {
        return res as ApiResponse<Offer>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<Offer>;
    } catch (error: unknown) {
      console.error('Error sending offer:', error);
      
      // Check if the error response contains data that indicates success
      const errorResponse = (error as any)?.response?.data;
      if (errorResponse && (errorResponse.success === true || errorResponse.data)) {
        console.log('Offer API detected successful response despite error:', errorResponse);
        return errorResponse;
      }
      
      throw error;
    }
  },

  getOffersByUserId: async (userId: string): Promise<ApiResponse<Offer[]>> => {
    try {
      console.log('Getting offers for user:', userId);
      const res = await requests.get(`offers/user/${userId}`);
      if ('success' in res) {
        return res as ApiResponse<Offer[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Offer[]>;
    } catch (error: unknown) {
      console.error('Error getting offers by user ID:', error);
      throw error;
    }
  },

  // Get offers for a specific tender
  getOffersByTenderId: async (tenderId: string): Promise<ApiResponse<Offer[]>> => {
    try {
      console.log('Getting offers for tender:', tenderId);
      const res = await requests.get(`offers/tender/${tenderId}`);
      if ('success' in res) {
        return res as ApiResponse<Offer[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Offer[]>;
    } catch (error: unknown) {
      console.error('Error getting offers by tender ID:', error);
      throw error;
    }
  },
};

