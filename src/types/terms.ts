// types/terms.ts
export interface Terms {
  _id: string;
  title: string;
  content: string;
  version: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTermsDto {
  title: string;
  content: string;
  version: string;
}

export interface UpdateTermsDto {
  title?: string;
  content?: string;
  version?: string;
}

export interface DeleteTermsResponse {
  message: string;
}