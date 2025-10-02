import { requests } from './utils';

interface Category {
  _id: string;
  name: string;
  type: string;
  description?: string;
  thumb?: {
    _id: string;
    url: string;
    filename: string;
  } | null;
  attributes?: string[];
  parent?: string | null;
  children?: string[];
  level: number;
  path: string[];
  fullPath: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface CategoryWithAncestors {
  category: Category;
  ancestors: Category[];
}

interface CategoryWithDescendants {
  category: Category;
  descendants: Category[];
}

export const CategoryAPI = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const res = await requests.get('category');
      if ('success' in res) {
        return res as ApiResponse<Category[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Category[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getRootCategories: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const res = await requests.get('category/roots');
      if ('success' in res) {
        return res as ApiResponse<Category[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Category[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getCategoryTree: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const res = await requests.get('category/tree');
      if ('success' in res) {
        return res as ApiResponse<Category[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Category[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getCategoriesByParent: async (parentId?: string): Promise<ApiResponse<Category[]>> => {
    try {
      const url = parentId ? `category/by-parent?parentId=${parentId}` : 'category/by-parent';
      const res = await requests.get(url);
      if ('success' in res) {
        return res as ApiResponse<Category[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Category[]>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getCategory: async (id: string): Promise<ApiResponse<Category>> => {
    try {
      const res = await requests.get(`category/${id}`);
      if ('success' in res) {
        return res as ApiResponse<Category>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<Category>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getCategoryWithAncestors: async (id: string): Promise<ApiResponse<CategoryWithAncestors>> => {
    try {
      const res = await requests.get(`category/${id}/with-ancestors`);
      if ('success' in res) {
        return res as ApiResponse<CategoryWithAncestors>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<CategoryWithAncestors>;
    } catch (error: unknown) {
      throw error;
    }
  },

  getCategoryWithDescendants: async (id: string): Promise<ApiResponse<CategoryWithDescendants>> => {
    try {
      const res = await requests.get(`category/${id}/with-descendants`);
      if ('success' in res) {
        return res as ApiResponse<CategoryWithDescendants>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data,
        message: (res as any)?.data?.message,
      } as ApiResponse<CategoryWithDescendants>;
    } catch (error: unknown) {
      throw error;
    }
  },
};