import { requests } from './utils';

interface SubCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const SubCategoryAPI = {
  getSubCategories: async (): Promise<ApiResponse<SubCategory[]>> => {
    try {
      const res = await requests.get('subcategory');
      return res as any;
    } catch (error: unknown) {
      throw error;
    }
  },
}; 