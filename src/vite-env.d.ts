/// <reference types="vite/client" />

interface AppBuildMetadata {
  deploymentId: string;
  version: string;
  commit: string;
  buildTime: string;
  buildNumber: string;
  environment: string;
}

declare const __APP_BUILD__: AppBuildMetadata;

interface ImportMetaEnv {
  readonly VITE_PWA_UPDATE_ENABLED?: string;
  readonly VITE_PWA_UPDATE_STRATEGY?:
    | "both"
    | "service-worker"
    | "version";
  readonly VITE_PWA_VERSION_URL?: string;
  readonly VITE_PWA_POLL_INTERVAL_MS?: string;
  readonly VITE_PWA_NOTIFICATION_BEHAVIOR?: "prompt" | "disabled";
  readonly VITE_PWA_LOG_LEVEL?: "silent" | "error" | "info" | "debug";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
