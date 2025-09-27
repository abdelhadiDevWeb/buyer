import { ID, ISODateString } from './primitives';
import { Product } from './product';
import User from './User';

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'SHIPPED' | 'COMPLETED';

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: ID;
  buyer: User | ID;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

