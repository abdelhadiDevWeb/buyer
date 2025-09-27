import axios from 'axios';

// Define the base URL of your NestJS API
const API_BASE_URL = 'https://mazad-click-server.onrender.com/comments'; // Change this to your actual API URL

// Define the interfaces for the data models to ensure type safety
interface User {
  _id: string;
  // Add other user properties here if you have them
}

export interface Comment {
  _id: string;
  comment: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface BidWithComments {
  _id: string;
  // Add other bid properties here
  comments: Comment[];
  // Add other populated fields from the bid schema
}

// API functions for interacting with the comment endpoints
const commentsApi = {
  /**
   * Creates a new comment.
   * Corresponds to: POST /comments
   */
  createComment: async (comment: string, userId: string): Promise<Comment> => {
    const response = await axios.post(API_BASE_URL, { comment, user: userId });
    return response.data;
  },

  /**
   * Finds a comment by its ID.
   * Corresponds to: GET /comments/:id
   */
  getCommentById: async (commentId: string): Promise<Comment> => {
    const response = await axios.get(`${API_BASE_URL}/${commentId}`);
    return response.data;
  },

  /**
   * Creates a new comment for a specific bid.
   * Corresponds to: POST /comments/bid/:bidId
   */
  createCommentForBid: async (bidId: string, comment: string, userId: string): Promise<Comment> => {
    const response = await axios.post(`${API_BASE_URL}/bid/${bidId}`, { comment, user: userId });
    return response.data;
  },

  /**
   * Gets a bid and all its associated comments.
   * Corresponds to: GET /comments/bid/:bidId
   */
  getBidWithComments: async (bidId: string): Promise<BidWithComments> => {
    const response = await axios.get(`${API_BASE_URL}/bid/${bidId}`);
    return response.data;
  },
};

export default commentsApi;