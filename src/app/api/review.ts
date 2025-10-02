import axios from 'axios';
import app from '@/config';

const API_BASE_URL = app.baseURL;

export const ReviewAPI = {
  // Like a user
  likeUser: async (userId: string, comment?: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/review/like/${userId}`,
        { comment },
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').tokens?.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error liking user:', error);
      throw error;
    }
  },

  // Dislike a user
  dislikeUser: async (userId: string, comment?: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/review/dislike/${userId}`,
        { comment },
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').tokens?.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error disliking user:', error);
      throw error;
    }
  }
}; 