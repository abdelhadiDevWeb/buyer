export enum TENDER_TYPE {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum TENDER_STATUS {
  OPEN = 'OPEN',
  AWARDED = 'AWARDED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum TENDER_AUCTION_TYPE {
  CLASSIC = 'CLASSIC',
  EXPRESS = 'EXPRESS',
}

export interface Tender {
  _id: string;
  owner: any;
  title: string;
  description: string;
  requirements: string[];
  category: any;
  subCategory?: any;
  attachments: any[];
  startingAt: string;
  endingAt: string;
  tenderType: TENDER_TYPE;
  auctionType: TENDER_AUCTION_TYPE;
  maxBudget: number;
  currentLowestBid: number;
  quantity?: string;
  wilaya: string;
  location: string;
  isPro: boolean;
  minimumPrice?: number;
  awardedTo?: any;
  status: TENDER_STATUS;
  comments: string[];
  createdAt: string;
  updatedAt: string;
}

export enum TenderBidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export interface TenderBid {
  _id: string;
  bidder: any;
  tenderOwner: any;
  tender: any;
  bidAmount: number;
  proposal?: string;
  deliveryTime?: number;
  status: TenderBidStatus;
  createdAt: string;
  updatedAt: string;
}
