import { ID, ISODateString } from './primitives';

export enum TENDER_AUCTION_TYPE {
  CLASSIC = 'CLASSIC',
  EXPRESS = 'EXPRESS',
}

export enum TENDER_STATUS {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT',
}

export type TENDER_TYPE = 'PRODUCT' | 'SERVICE';

export interface TenderCategory {
  _id: ID;
  name: string;
}

export interface Tender {
  _id: ID;
  owner: any;
  title: string;
  description: string;
  requirements: string[];
  category?: TenderCategory;
  subCategory?: any;
  attachments: any[];
  startingAt: ISODateString;
  endingAt: ISODateString;
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
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
// Removed duplicate enums and interfaces below to avoid re-definition conflicts
