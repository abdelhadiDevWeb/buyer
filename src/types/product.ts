import { ID, ISODateString } from './primitives';

export interface Product {
  _id: ID;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

