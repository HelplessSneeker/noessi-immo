import { AxiosError } from 'axios';
import { isValidationError, isApiError } from '../types/errors';

/**
 * Type guard for Axios errors
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Check if error is a network/connection error (no response received)
 */
export function isNetworkError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return !error.response;
}

/**
 * Extract user-friendly error message from an error
 * Backend already provides translated messages, so we just extract them
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage;

  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (!data) {
      // Network error - no response received
      return fallbackMessage;
    }

    // Validation error (422) - array of field errors
    if (isValidationError(data)) {
      return data.detail.map((e) => e.msg).join(', ');
    }

    // Standard API error - already translated string
    if (isApiError(data)) {
      return data.detail;
    }

    // Fallback for unexpected response format
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Extract all validation errors as an array for form display
 */
export function getValidationErrors(error: unknown): string[] {
  if (!isAxiosError(error)) return [];

  const data: unknown = error.response?.data;
  if (!data) return [];

  // Validation error (422) - array of field errors
  if (isValidationError(data)) {
    return data.detail.map((e) => e.msg);
  }

  // Standard API error - single message
  if (isApiError(data)) {
    return [data.detail];
  }

  // Fallback for string detail
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return [detail];
    }
  }

  return [];
}
