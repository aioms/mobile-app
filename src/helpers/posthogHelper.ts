import { captureClientError } from './api-telemetry';
interface ExceptionContext {
  page?: string; component?: string; action?: string; userId?: string;
  additionalData?: Record<string, unknown>;
}
/** Only static UI context is exported. Business payloads/user IDs stay out of errors. */
export const captureException = (error: Error, context?: ExceptionContext) => {
  captureClientError(error, { page: context?.page, component: context?.component, action: context?.action });
};
export const withExceptionCapture = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>, context?: ExceptionContext,
) => async (...args: T): Promise<R> => {
  try { return await fn(...args); }
  catch (error) { captureException(error instanceof Error ? error : new Error('UnknownError'), context); throw error; }
};
export const createExceptionContext = (page: string, component?: string, action?: string): ExceptionContext => ({ page, component, action });
