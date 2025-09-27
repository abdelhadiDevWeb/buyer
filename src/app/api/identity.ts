import { requests } from './utils';

interface Identity {
  id: string;
  type: string;
  number: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const IdentityAPI = {
  getIdentities: async (): Promise<ApiResponse<Identity[]>> => {
    try {
      const res = await requests.get('identities');
      return res as any;
    } catch (error: unknown) {
      console.error('Error fetching identities:', error);
      throw error;
    }
  },

  getMyIdentity: async (): Promise<ApiResponse<Identity>> => {
    try {
      const res = await requests.get('identities/me');
      return res as any;
    } catch (error: unknown) {
      console.error('Error fetching my identity:', error);
      throw error;
    }
  },

  createIdentity: async (identityData: Partial<Identity>): Promise<ApiResponse<Identity>> => {
    try {
      const res = await requests.post('identities', identityData);
      return res as any;
    } catch (error: unknown) {
      console.error('Error creating identity:', error);
      throw error;
    }
  },

  // Add this method to handle reseller identity creation
  createResellerIdentity: async (formData: FormData): Promise<ApiResponse<Identity>> => {
    try {
      console.log('🆔 === CREATE RESELLER IDENTITY ===');
      
      if (!formData) {
        throw new Error('FormData is required for reseller identity creation');
      }
      
      // Check if identityCard file exists in FormData
      const hasIdentityCard = Array.from(formData.entries()).some(([key, value]) => 
        key === 'identityCard' && value instanceof File
      );
      
      if (!hasIdentityCard) {
        console.error('❌ No identityCard file found in FormData');
        throw new Error('identityCard file is required');
      }
      
      console.log('✅ identityCard file validated');
      
      // Use the postFormData method from requests
      const res = await requests.postFormData('identities/reseller', formData);
      return res as any;
    } catch (error: unknown) {
      console.error('Error creating reseller identity:', error);
      throw error;
    }
  },

  updateIdentity: async (id: string, identityData: Partial<Identity>): Promise<ApiResponse<Identity>> => {
    try {
      const res = await requests.put(`identities/${id}`, identityData);
      return res as any;
    } catch (error: unknown) {
      console.error('Error updating identity:', error);
      throw error;
    }
  },

  deleteIdentity: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const res = await requests.delete(`identities/${id}`);
      return res as any;
    } catch (error: unknown) {
      console.error('Error deleting identity:', error);
      throw error;
    }
  },
};