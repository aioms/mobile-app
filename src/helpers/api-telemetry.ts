import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import posthog from "posthog-js";
const requests = new WeakMap<object, { id: string; started: number }>();
const captured = new WeakSet<object>();

/** Per-attempt correlation; preserve X-Request-ID used for business idempotency. */
export function beginApiRequest(config: InternalAxiosRequestConfig) {
  const id = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  config.headers.set("X-Correlation-ID", id);
  requests.set(config, { id, started: performance.now() });
  return config;
}

/** Capture a projected error, never AxiosError (which embeds token/body/URL). */
export function captureApiFailure(error: unknown) {
  if (!axios.isAxiosError(error)) return;
  if (error.code === "ERR_CANCELED") return;
  const status = error.response?.status;
  if (status && status < 500) return;
  const request = error.config && requests.get(error.config);
  const safe = new Error(status ? `API HTTP ${status}` : "API network failure");
  safe.name = "ApiError";
  safe.stack = undefined;
  captureClientError(safe, {
    method: error.config?.method?.toUpperCase(), status: status || 0,
    error_code: error.code, correlation_id: request?.id,
    trace_id: error.response?.headers?.["x-trace-id"],
    duration_ms: request && Math.round(performance.now() - request.started),
  });
  // Hooks/global rejection handlers may see the same Axios error afterward.
  captured.add(error);
}

/** Record correlation on the response object before callers receive response.data. */
export function finishApiRequest(response: AxiosResponse) {
  const request = requests.get(response.config);
  if (request) response.headers["x-correlation-id"] ||= request.id;
}

export function captureClientError(error: unknown, properties: Record<string, unknown> = {}) {
  if (axios.isAxiosError(error) && (error.code === 'ERR_CANCELED' ||
    (error.response?.status && error.response.status < 500))) return;
  if (!['production', 'staging'].includes(import.meta.env.VITE_ENV || '')) return;
  if (error && typeof error === 'object') {
    if (captured.has(error)) return;
    captured.add(error);
  }
  const original = error instanceof Error ? error : new Error('UnknownError');
  const safe = new Error(/^[\w.]{1,80}$/.test(original.name) ? original.name : 'Error');
  safe.name = safe.message;
  const frames = original.stack?.split('\n').filter((line) => /^\s*at /.test(line)).slice(0, 20).join('\n');
  safe.stack = frames ? `${safe.name}: ${safe.message}\n${frames}` : undefined;
  try { posthog.captureException(safe, { source: 'mobile', release: __APP_BUILD__.commit, ...properties }); }
  catch { console.warn('client_error_capture_failed'); }
}

let installed = false;
export function installClientErrorTracking() {
  if (installed) return;
  installed = true;
  window.addEventListener('error', (event) => captureClientError(event.error));
  window.addEventListener('unhandledrejection', (event) => captureClientError(event.reason));
}
