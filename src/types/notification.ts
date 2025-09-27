import { ID, ISODateString } from './primitives';

export type NotificationType =
  | 'BID_CREATED'
  | 'BID_ENDED'
  | 'BID_WON'
  | 'MESSAGE_ADMIN'
  | 'MESSAGE_RECEIVED'
  | 'CHAT_CREATED'
  | string;

export interface NotificationData {
  senderId?: ID | 'admin';
  senderName?: string;
  senderEmail?: string;
  buyerName?: string;
  winnerName?: string;
  [key: string]: unknown;
}

export interface Notification {
  _id: ID;
  userId: ID;
  title: string;
  message: string;
  type: NotificationType;
  data?: NotificationData;
  read: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  receiver?: ID;
  reciver?: ID;
}

