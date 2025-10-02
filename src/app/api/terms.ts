// terms.api.ts
import { requests } from "./utils";
import { Terms } from "../../types/terms";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const TermsAPI = {
  /**
   * Get all terms and conditions (Public endpoint)
   */
  getPublic: async (): Promise<ApiResponse<Terms[]>> => {
    const res = await requests.get('terms/public');
    if ('success' in res) {
      return res as ApiResponse<Terms[]>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
      message: (res as any)?.data?.message,
    } as ApiResponse<Terms[]>;
  },

  /**
   * Get latest terms (Public endpoint)
   */
  getLatest: async (): Promise<ApiResponse<Terms>> => {
    const res = await requests.get('terms/latest');
    if ('success' in res) {
      return res as ApiResponse<Terms>;
    }
    return {
      success: (res as any)?.status >= 200 && (res as any)?.status < 300,
      data: (res as any)?.data?.data ?? (res as any)?.data,
      message: (res as any)?.data?.message,
    } as ApiResponse<Terms>;
  },
}