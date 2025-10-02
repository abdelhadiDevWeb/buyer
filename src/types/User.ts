export enum CLIENT_TYPE {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT',
  RESELLER = 'RESELLER',
  PROFESSIONAL = 'PROFESSIONAL',
}

interface Attachment {
  _id?: string;
  url?: string;
  filename?: string;
}

export default interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  type: CLIENT_TYPE;
  gender?: string;
  phone?: string;
  role?: string;
  rate?: number;
  displayName?: string;
  photoURL?: string;
  avatar?: Attachment;
  isHasIdentity?: boolean;
}