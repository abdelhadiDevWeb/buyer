import { ID, ISODateString } from './primitives';

export enum USER_TYPE {
  CLIENT = 'CLIENT',
  RESELLER = 'RESELLER',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum CLIENT_TYPE {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT',
  RESELLER = 'RESELLER',
  PROFESSIONAL = 'PROFESSIONAL',
}

export interface Attachment {
  _id?: string;
  url?: string;
  filename?: string;
  fullUrl?: string;
}

export default interface User {
  _id: ID;
  id?: ID;
  firstName: string;
  lastName: string;
  email: string;
  type?: CLIENT_TYPE | USER_TYPE;
  accountType?: USER_TYPE;
  gender?: string;
  phone?: string;
  role?: string;
  rate?: number;
  displayName?: string;
  photoURL?: string;
  avatar?: Attachment | string | null;
  isHasIdentity?: boolean;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  isBanned?: boolean;
  fullName?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}
 