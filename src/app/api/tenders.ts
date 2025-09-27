// Buyer-side tenders API
import { requests } from './utils';

export const TendersAPI = {
  // Get all active tenders
  getActiveTenders: (): Promise<any> => requests.get('tender'),
  
  // Get specific tender by ID
  getTenderById: (id: string): Promise<any> => requests.get(`tender/${id}`),
  
  // Submit a bid on a tender
  submitTenderBid: (tenderId: string, bid: any): Promise<any> => 
    requests.post(`tender/${tenderId}/bid`, bid),
  
  // Get bids for a specific tender
  getTenderBids: (tenderId: string): Promise<any> => 
    requests.get(`tender/${tenderId}/bids`),
  
  // Get tender bids made by current user (seller perspective)
  getMyTenderBids: (userId: string): Promise<any> => 
    requests.get(`tender/bidder/${userId}/bids`),
};
