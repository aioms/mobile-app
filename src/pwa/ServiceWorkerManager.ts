import { PWAUpdateLogger } from "./logger";

export type ServiceWorkerUpdateEvent =
  | { type: "registered"; registration: ServiceWorkerRegistration }
  | { type: "installing" }
  | { type: "installed" }
  | { type: "waiting" }
  | { type: "activated" }
  | { type: "error"; error: unknown };

type ServiceWorkerUpdateListener = (event: ServiceWorkerUpdateEvent) => void;

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private registrationPromise: Promise<ServiceWorkerRegistration | null> | null =
    null;
  private listener: ServiceWorkerUpdateListener | null = null;
  private updateFoundListener: (() => void) | null = null;
  private lastWaitingWorker: ServiceWorker | null = null;
  private waitingResolvers = new Set<(worker: ServiceWorker) => void>();
  private activationPromise: Promise<void> | null = null;
  private activationRequested = false;
  private hasReloaded = false;
  private started = false;

  constructor(
    private readonly serviceWorkerUrl: string,
    private readonly scope: string,
    private readonly activationTimeoutMs: number,
    private readonly logger: PWAUpdateLogger,
    private readonly reloadPage: () => void = () => window.location.reload(),
  ) {}

  get isSupported() {
    return typeof navigator !== "undefined" && "serviceWorker" in navigator;
  }

  start(listener: ServiceWorkerUpdateListener) {
    if (this.started) return;

    this.started = true;
    this.listener = listener;

    if (!this.isSupported) {
      this.logger.info("Service Worker unavailable in this environment");
      return;
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      this.handleControllerChange,
    );

    this.registrationPromise = navigator.serviceWorker
      .register(this.serviceWorkerUrl, {
        scope: this.scope,
        updateViaCache: "none",
      })
      .then((registration) => {
        if (!this.started) return registration;

        this.registration = registration;
        this.attachRegistration(registration);
        this.logger.info("Service Worker registered", {
          scope: registration.scope,
        });
        this.emit({ type: "registered", registration });

        if (registration.waiting && navigator.serviceWorker.controller) {
          this.notifyWaiting(registration.waiting);
        }

        return registration;
      })
      .catch((error: unknown) => {
        this.logger.error("Service Worker registration failed", error);
        this.emit({ type: "error", error });
        return null;
      });
  }

  stop() {
    this.started = false;
    this.listener = null;

    if (this.isSupported) {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        this.handleControllerChange,
      );
    }

    if (this.registration && this.updateFoundListener) {
      this.registration.removeEventListener(
        "updatefound",
        this.updateFoundListener,
      );
    }

    this.updateFoundListener = null;
  }

  async checkForUpdate() {
    if (!this.isSupported || !navigator.onLine) return;

    const registration = await this.getRegistration();
    if (!registration || registration.installing) return;

    try {
      this.logger.debug("Checking Service Worker for updates");
      await registration.update();
    } catch (error) {
      this.logger.error("Service Worker update check failed", error);
      this.emit({ type: "error", error });
    }
  }

  async activateUpdate() {
    if (this.activationPromise) return this.activationPromise;

    this.activationPromise = this.activateWaitingWorker().finally(() => {
      this.activationPromise = null;
    });

    return this.activationPromise;
  }

  private async activateWaitingWorker() {
    const registration = await this.getRegistration();
    if (!registration) {
      throw new Error("Service Worker is not registered");
    }

    let waitingWorker = registration.waiting;
    if (!waitingWorker) {
      const waitingPromise = this.waitForWaitingWorker();
      await this.checkForUpdate();
      waitingWorker = registration.waiting || (await waitingPromise);
    }

    this.activationRequested = true;
    this.logger.info("Activating waiting Service Worker");

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;

        if (waitingWorker.state === "activated") {
          this.activationRequested = false;
          resolve();
          this.reloadOnce();
          return;
        }

        this.activationRequested = false;
        reject(new Error("Timed out while activating the Service Worker"));
      }, this.activationTimeoutMs);

      const handleStateChange = () => {
        if (waitingWorker.state !== "redundant") return;
        if (settled) return;

        settled = true;
        window.clearTimeout(timeout);
        this.activationRequested = false;
        reject(new Error("The waiting Service Worker became redundant"));
      };

      waitingWorker.addEventListener("statechange", handleStateChange);
      this.waitForControllerChange = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        waitingWorker.removeEventListener("statechange", handleStateChange);
        resolve();
      };

      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    });
  }

  private waitForControllerChange: (() => void) | null = null;

  private handleControllerChange = () => {
    if (!this.activationRequested) {
      this.logger.info("Service Worker controller changed in another session");
      return;
    }

    this.activationRequested = false;
    this.waitForControllerChange?.();
    this.waitForControllerChange = null;
    this.emit({ type: "activated" });
    this.reloadOnce();
  };

  private reloadOnce() {
    if (this.hasReloaded) return;

    this.hasReloaded = true;
    this.logger.info("Update completed");
    this.logger.info("Reload triggered");
    this.reloadPage();
  }

  private async getRegistration() {
    if (this.registration) return this.registration;
    return this.registrationPromise;
  }

  private attachRegistration(registration: ServiceWorkerRegistration) {
    this.updateFoundListener = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      this.logger.info("New Service Worker installing");
      this.emit({ type: "installing" });

      const handleStateChange = () => {
        if (installingWorker.state === "installed") {
          this.logger.info("New Service Worker installed");
          this.emit({ type: "installed" });

          if (navigator.serviceWorker.controller) {
            window.setTimeout(() => {
              this.notifyWaiting(registration.waiting || installingWorker);
            });
          }
        } else if (installingWorker.state === "redundant") {
          const error = new Error(
            "Service Worker installation failed or became redundant",
          );
          this.logger.error("Service Worker installation failed", error);
          this.emit({ type: "error", error });
        }
      };

      installingWorker.addEventListener("statechange", handleStateChange);
    };

    registration.addEventListener("updatefound", this.updateFoundListener);

    if (registration.installing) {
      this.updateFoundListener();
    }
  }

  private notifyWaiting(worker: ServiceWorker) {
    if (this.lastWaitingWorker === worker) return;

    this.lastWaitingWorker = worker;
    this.logger.info("Service Worker waiting for user confirmation");
    this.emit({ type: "waiting" });
    this.waitingResolvers.forEach((resolve) => resolve(worker));
    this.waitingResolvers.clear();
  }

  private waitForWaitingWorker() {
    if (this.registration?.waiting) {
      return Promise.resolve(this.registration.waiting);
    }

    return new Promise<ServiceWorker>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.waitingResolvers.delete(handleWaiting);
        reject(new Error("Timed out while downloading the application update"));
      }, this.activationTimeoutMs);

      const handleWaiting = (worker: ServiceWorker) => {
        window.clearTimeout(timeout);
        resolve(worker);
      };

      this.waitingResolvers.add(handleWaiting);
    });
  }

  private emit(event: ServiceWorkerUpdateEvent) {
    this.listener?.(event);
  }
}
