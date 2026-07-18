import { PWAUpdateLogger } from "./logger";
import {
  ServiceWorkerManager,
  type ServiceWorkerUpdateEvent,
} from "./ServiceWorkerManager";
import type {
  AppUpdateState,
  PWAUpdateConfig,
  UpdateSource,
} from "./types";
import { VersionService } from "./VersionService";

const DISMISSED_VERSION_STORAGE_KEY = "aiom:pwa-update:dismissed-version";

type UpdateStateListener = (state: AppUpdateState) => void;

export class UpdateManager {
  private state: AppUpdateState;
  private listeners = new Set<UpdateStateListener>();
  private pollTimer: number | null = null;
  private versionRequest: AbortController | null = null;
  private isCheckingVersion = false;
  private started = false;
  private lastRemoteVersion: AppBuildMetadata | null = null;

  constructor(
    private readonly config: PWAUpdateConfig,
    private readonly versionService: VersionService,
    private readonly serviceWorkerManager: ServiceWorkerManager,
    private readonly logger: PWAUpdateLogger,
    private readonly storage: Storage | null,
  ) {
    this.state = {
      currentVersion: versionService.getCurrentVersion(),
      remoteVersion: null,
      detectionId: null,
      sources: [],
      status: "idle",
      isUpdateAvailable: false,
      shouldNotify: false,
      error: null,
    };
  }

  getState() {
    return this.state;
  }

  subscribe(listener: UpdateStateListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.started || !this.config.enabled) return;

    this.started = true;
    this.logger.info("Current application version", this.state.currentVersion);
    this.serviceWorkerManager.start(this.handleServiceWorkerEvent);

    if (this.usesVersionDetection()) {
      void this.checkVersion();
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("online", this.handleOnline);
    }
  }

  stop() {
    this.started = false;
    this.serviceWorkerManager.stop();
    this.versionRequest?.abort();
    this.versionRequest = null;

    if (this.pollTimer !== null) {
      window.clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("online", this.handleOnline);
  }

  async checkForUpdate() {
    await Promise.all([
      this.usesVersionDetection()
        ? this.checkVersion(false)
        : Promise.resolve(),
      this.serviceWorkerManager.checkForUpdate(),
    ]);
  }

  dismissUpdate() {
    if (!this.state.detectionId) return;

    this.writeDismissedVersion(this.state.detectionId);
    this.logger.info("Update dismissed", {
      deploymentId: this.state.detectionId,
    });
    this.setState({
      status: "dismissed",
      shouldNotify: false,
      error: null,
    });
  }

  async applyUpdate() {
    if (!this.state.isUpdateAvailable || this.state.status === "updating") {
      return;
    }

    this.logger.info("Update accepted", {
      deploymentId: this.state.detectionId,
      sources: this.state.sources,
    });
    this.setState({ status: "updating", shouldNotify: true, error: null });
    window.dispatchEvent(
      new CustomEvent("app-update-accepted", {
        detail: { remoteVersion: this.state.remoteVersion },
      }),
    );

    try {
      if (this.serviceWorkerManager.isSupported) {
        await this.serviceWorkerManager.activateUpdate();
        return;
      }

      this.logger.info("Reload triggered without Service Worker support");
      window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to activate the application update";
      this.logger.error("Update activation failed", error);
      this.setState({
        status: "error",
        shouldNotify: true,
        error: message,
      });
    }
  }

  private handleServiceWorkerEvent = (event: ServiceWorkerUpdateEvent) => {
    if (event.type === "waiting" && this.usesServiceWorkerDetection()) {
      void this.handleWaitingServiceWorker();
    }
  };

  private async handleWaitingServiceWorker() {
    let remoteVersion = this.lastRemoteVersion;

    if (!remoteVersion && navigator.onLine) {
      try {
        remoteVersion = await this.versionService.getRemoteVersion();
        this.lastRemoteVersion = remoteVersion;
      } catch (error) {
        this.logger.debug(
          "Version metadata unavailable for waiting Service Worker",
          error,
        );
      }
    }

    this.markUpdateAvailable("service-worker", remoteVersion);
  }

  private async checkVersion(scheduleNext = true) {
    if (
      !this.started ||
      this.isCheckingVersion ||
      !navigator.onLine ||
      document.visibilityState === "hidden"
    ) {
      if (scheduleNext) this.scheduleVersionCheck();
      return;
    }

    this.isCheckingVersion = true;
    this.versionRequest?.abort();
    this.versionRequest = new AbortController();

    try {
      const remoteVersion = await this.versionService.getRemoteVersion(
        this.versionRequest.signal,
      );
      this.lastRemoteVersion = remoteVersion;
      this.logger.debug("Remote application version", remoteVersion);

      if (this.versionService.isUpdateAvailable(remoteVersion)) {
        const isNewDeployment =
          this.state.detectionId !== remoteVersion.deploymentId;
        this.markUpdateAvailable("version", remoteVersion);

        if (isNewDeployment) {
          await this.serviceWorkerManager.checkForUpdate();
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        this.logger.debug("Version check failed; application remains usable", error);
      }
    } finally {
      this.isCheckingVersion = false;
      this.versionRequest = null;
      if (scheduleNext) this.scheduleVersionCheck();
    }
  }

  private markUpdateAvailable(
    source: UpdateSource,
    remoteVersion: AppBuildMetadata | null,
  ) {
    const detectionId =
      remoteVersion?.deploymentId ||
      this.state.detectionId ||
      `service-worker:${this.state.currentVersion.deploymentId}`;
    const isNewDetection = this.state.detectionId !== detectionId;
    const sources = isNewDetection
      ? [source]
      : this.state.sources.includes(source)
        ? this.state.sources
        : [...this.state.sources, source];
    const wasDismissed = this.readDismissedVersion() === detectionId;
    const shouldNotify =
      this.config.notificationBehavior === "prompt" && !wasDismissed;

    if (isNewDetection) {
      this.logger.info("Update available", {
        deploymentId: detectionId,
        source,
      });
    }

    this.setState({
      remoteVersion: remoteVersion || this.state.remoteVersion,
      detectionId,
      sources,
      status: wasDismissed ? "dismissed" : "available",
      isUpdateAvailable: true,
      shouldNotify,
      error: null,
    });
  }

  private scheduleVersionCheck() {
    if (!this.started || !this.usesVersionDetection()) return;

    if (this.pollTimer !== null) window.clearTimeout(this.pollTimer);
    this.pollTimer = window.setTimeout(() => {
      this.pollTimer = null;
      void this.checkVersion();
    }, this.config.pollIntervalMs);
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void this.checkVersion();
    }
  };

  private handleOnline = () => {
    void this.checkForUpdate();
  };

  private usesVersionDetection() {
    return this.config.strategy === "both" || this.config.strategy === "version";
  }

  private usesServiceWorkerDetection() {
    return (
      this.config.strategy === "both" ||
      this.config.strategy === "service-worker"
    );
  }

  private readDismissedVersion() {
    try {
      return this.storage?.getItem(DISMISSED_VERSION_STORAGE_KEY) || null;
    } catch (error) {
      this.logger.debug("Unable to read dismissed update state", error);
      return null;
    }
  }

  private writeDismissedVersion(deploymentId: string) {
    try {
      this.storage?.setItem(DISMISSED_VERSION_STORAGE_KEY, deploymentId);
    } catch (error) {
      this.logger.debug("Unable to persist dismissed update state", error);
    }
  }

  private setState(patch: Partial<AppUpdateState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
}
