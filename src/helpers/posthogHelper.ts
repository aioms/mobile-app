import { posthog } from 'posthog-js';

interface ExceptionContext {
  page?: string;
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Captures exceptions to PostHog with consistent formatting and context
 * @param error - The error object to capture
 * @param context - Additional context information
 */
export const captureException = (error: Error, context?: ExceptionContext) => {
  try {
    // Prepare additional properties
    const additionalProperties: Record<string, any> = {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context?.additionalData,
    };

    // Add context information if provided
    if (context?.page) {
      additionalProperties.page = context.page;
    }
    
    if (context?.component) {
      additionalProperties.component = context.component;
    }
    
    if (context?.action) {
      additionalProperties.action = context.action;
    }
    
    if (context?.userId) {
      additionalProperties.user_id = context.userId;
    }

    // Capture the exception to PostHog
    posthog.captureException(error, additionalProperties);
    
    // Also log to console for development
    console.error('Exception captured to PostHog:', {
      error: error.message,
      context,
      additionalProperties
    });
  } catch (captureError) {
    // Fallback: log to console if PostHog capture fails
    console.error('Failed to capture exception to PostHog:', captureError);
    console.error('Original error:', error);
  }
};

/**
 * Wraps async functions with PostHog exception capturing
 * @param fn - The async function to wrap
 * @param context - Context information for error tracking
 * @returns Wrapped function that captures exceptions
 */
export const withExceptionCapture = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ExceptionContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, context);
      throw error; // Re-throw to maintain original error handling flow
    }
  };
};

/**
 * Creates a context object for consistent error tracking
 * @param page - Page name (e.g., 'OrderCreate', 'ProductList')
 * @param component - Component name (e.g., 'PaymentModal', 'ProductCard')
 * @param action - Action being performed (e.g., 'createOrder', 'updateProduct')
 * @returns Context object for exception capturing
 */
export const createExceptionContext = (
  page: string,
  component?: string,
  action?: string
): ExceptionContext => ({
  page,
  component,
  action,
});