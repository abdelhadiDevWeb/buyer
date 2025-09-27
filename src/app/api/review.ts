import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazad-click-server.onrender.com';

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