export type UpdateDetectionStrategy =
  | "both"
  | "service-worker"
  | "version";

export type UpdateNotificationBehavior = "prompt" | "disabled";

export type UpdateLogLevel = "silent" | "error" | "info" | "debug";

export type UpdateSource = "service-worker" | "version";

export type UpdateStatus =
  | "idle"
  | "available"
  | "dismissed"
  | "updating"
  | "error";

export interface PWAUpdateConfig {
  enabled: boolean;
  strategy: UpdateDetectionStrategy;
  notificationBehavior: UpdateNotificationBehavior;
  versionUrl: string;
  serviceWorkerUrl: string;
  serviceWorkerScope: string;
  pollIntervalMs: number;
  activationTimeoutMs: number;
  logLevel: UpdateLogLevel;
}

export interface AppUpdateState {
  currentVersion: AppBuildMetadata;
  remoteVersion: AppBuildMetadata | null;
  detectionId: string | null;
  sources: UpdateSource[];
  status: UpdateStatus;
  isUpdateAvailable: boolean;
  shouldNotify: boolean;
  error: string | null;
}

export interface AppUpdateContextValue extends AppUpdateState {
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  checkForUpdate: () => Promise<void>;
}
