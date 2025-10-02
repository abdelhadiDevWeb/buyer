import { requests } from './utils';

interface Comment {
  id: string;
  content: string;
  userId: string;
  auctionId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const CommentAPI = {
  getComments: async (): Promise<ApiResponse<Comment[]>> => {
    try {
      const res = await requests.get('comments');
      if ('success' in res) {
        return res as ApiResponse<Comment[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<Comment[]>;
    } catch (error: unknown) {
      throw error;
    }
  },
}; 