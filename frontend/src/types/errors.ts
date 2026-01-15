// API Error response from backend (400, 404, 500)
export interface ApiErrorResponse {
  detail: string;
  request_id: string;
  error_type: string;
}

// Pydantic validation error detail (422)
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Validation error response (422)
export interface ValidationErrorResponse {
  detail: ValidationErrorDetail[];
}

// Union type for all error responses
export type ErrorResponse = ApiErrorResponse | ValidationErrorResponse;

// Type guards
export function isValidationError(error: unknown): error is ValidationErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    Array.isArray((error as ValidationErrorResponse).detail)
  );
}

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    typeof (error as ApiErrorResponse).detail === 'string'
  );
}
