import { requests } from "./utils";

interface AutoBid {
  id: string;
  price: number;
  bid: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateAutoBidData {
  price: number;
  user: string;
  bid: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AutoBidAPI = {
  getAutoBids: async (): Promise<ApiResponse<AutoBid[]>> => {
    try {
      const res = await requests.get('auto-bids');
      if ('success' in res) {
        return res as ApiResponse<AutoBid[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<AutoBid[]>;
    } catch (error: unknown) {
      throw error;
    }
  },
  
  // Get auto-bid by auction ID and user ID
  getAutoBidByAuctionAndUser: async (auctionId: string): Promise<ApiResponse<AutoBid>> => {
    try {
      console.log('Getting auto-bid for auction:', auctionId);
      // Use the correct endpoint based on the server controller
      const res = await requests.get(`auto-bid/auction/${auctionId}/user`);
      console.log('Auto-bid get response:', res);
      if ('success' in res) {
        return res as ApiResponse<AutoBid>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<AutoBid>;
    } catch (error: unknown) {
      console.error('Error getting auto-bid:', error);
      throw error;
    }
  },
  
  // Create or update auto-bid
  createOrUpdateAutoBid: async (auctionId: string, autoBidData: CreateAutoBidData): Promise<ApiResponse<AutoBid>> => {
    try {
      console.log('Creating/updating auto-bid for auction:', auctionId, 'with data:', autoBidData);
      // Use the correct endpoint based on the server controller
      const res = await requests.post(`auto-bid/${auctionId}`, autoBidData);
      console.log('Auto-bid API response:', res);
      if ('success' in res) {
        return res as ApiResponse<AutoBid>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<AutoBid>;
    } catch (error: unknown) {
      console.error('Error creating/updating auto-bid:', error);
      
      // Check if the error response contains data that indicates success
      const errorResponse = (error as any)?.response?.data;
      if (errorResponse && (errorResponse.success === true || errorResponse.data)) {
        console.log('Auto-bid API detected successful response despite error:', errorResponse);
        return errorResponse;
      }
      
      throw error;
    }
  },
  
  // Delete auto-bid
  deleteAutoBid: async (auctionId: string, userId: string): Promise<ApiResponse<any>> => {
    try {
      console.log('Deleting auto-bid for auction:', auctionId, 'and user:', userId);
      // Use the correct endpoint based on the server controller
      const res = await requests.delete(`auto-bid/${auctionId}/user/${userId}`);
      if ('success' in res) {
        return res as ApiResponse<any>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<any>;
    } catch (error: unknown) {
      console.error('Error deleting auto-bid:', error);
      throw error;
    }
  }
};