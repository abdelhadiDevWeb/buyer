// API Error Types for better TypeScript support

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: string[];
  statusCode?: number;
  [key: string]: unknown;
}

export interface ApiError {
  response?: {
    data?: ApiErrorResponse | string;
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  canRetry: boolean;
}

// Utility function to safely extract error message
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  // Handle ApiError type
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    
    // Check for response.data.message
    if (apiError.response?.data) {
      const responseData = apiError.response.data;
      
      if (typeof responseData === 'object' && responseData !== null) {
        const errorResponse = responseData as ApiErrorResponse;
        if (errorResponse.message) {
          return errorResponse.message;
        }
        if (errorResponse.error) {
          return errorResponse.error;
        }
        if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
          return errorResponse.errors.join(', ');
        }
      } else if (typeof responseData === 'string') {
        return responseData;
      }
    }
    
    // Check for direct message property
    if (apiError.message) {
      return apiError.message;
    }
  }
  
  // Handle Error type
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback
  return 'An unknown error occurred';
}

// Utility function to check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  
  const apiError = error as ApiError;
  const status = apiError.response?.status;
  
  // Don't retry on client errors (4xx) except 408, 429
  if (status && status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }
  
  // Retry on server errors (5xx)
  if (status && status >= 500) {
    return true;
  }
  
  // Retry on network errors (no status)
  return !status;
}
