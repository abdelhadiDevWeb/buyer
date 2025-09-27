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
      return res as any;
    } catch (error: unknown) {
      throw error;
    }
  },
}; 