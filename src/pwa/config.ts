import type {
  PWAUpdateConfig,
  UpdateDetectionStrategy,
  UpdateLogLevel,
  UpdateNotificationBehavior,
} from "./types";

const MINIMUM_POLL_INTERVAL_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 15 * 60_000;
const DEFAULT_ACTIVATION_TIMEOUT_MS = 30_000;

const getBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const getPollInterval = (value: string | undefined) => {
  if (!value) return DEFAULT_POLL_INTERVAL_MS;

  const interval = Number(value);
  if (!Number.isFinite(interval)) return DEFAULT_POLL_INTERVAL_MS;

  return Math.max(interval, MINIMUM_POLL_INTERVAL_MS);
};

const getStrategy = (
  value: string | undefined,
): UpdateDetectionStrategy => {
  if (value === "service-worker" || value === "version") return value;
  return "both";
};

const getNotificationBehavior = (
  value: string | undefined,
): UpdateNotificationBehavior => {
  return value === "disabled" ? "disabled" : "prompt";
};

const getLogLevel = (value: string | undefined): UpdateLogLevel => {
  if (
    value === "silent" ||
    value === "error" ||
    value === "debug"
  ) {
    return value;
  }

  return "info";
};

const baseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const pwaUpdateConfig: PWAUpdateConfig = {
  enabled:
    import.meta.env.PROD &&
    getBoolean(import.meta.env.VITE_PWA_UPDATE_ENABLED, true),
  strategy: getStrategy(import.meta.env.VITE_PWA_UPDATE_STRATEGY),
  notificationBehavior: getNotificationBehavior(
    import.meta.env.VITE_PWA_NOTIFICATION_BEHAVIOR,
  ),
  versionUrl:
    import.meta.env.VITE_PWA_VERSION_URL || `${baseUrl}version.json`,
  serviceWorkerUrl: `${baseUrl}sw.js`,
  serviceWorkerScope: baseUrl,
  pollIntervalMs: getPollInterval(
    import.meta.env.VITE_PWA_POLL_INTERVAL_MS,
  ),
  activationTimeoutMs: DEFAULT_ACTIVATION_TIMEOUT_MS,
  logLevel: getLogLevel(import.meta.env.VITE_PWA_LOG_LEVEL),
};
