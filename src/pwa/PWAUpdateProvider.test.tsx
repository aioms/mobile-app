import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PWAUpdateLogger } from "./logger";
import type { ServiceWorkerUpdateEvent } from "./ServiceWorkerManager";
import type { PWAUpdateConfig } from "./types";
import { UpdateManager } from "./UpdateManager";
import { VersionService } from "./VersionService";

const currentVersion: AppBuildMetadata = {
  deploymentId: "deployment-current",
  version: "1.0.0",
  commit: "current",
  buildTime: "2026-07-23T00:00:00.000Z",
  buildNumber: "1",
  environment: "test",
};

const remoteVersion: AppBuildMetadata = {
  ...currentVersion,
  deploymentId: "deployment-next",
  version: "1.1.0",
  commit: "next",
  buildNumber: "2",
};

const config: PWAUpdateConfig = {
  enabled: true,
  strategy: "service-worker",
  notificationBehavior: "prompt",
  versionUrl: "/version.json",
  serviceWorkerUrl: "/sw.js",
  serviceWorkerScope: "/",
  pollIntervalMs: 60_000,
  activationTimeoutMs: 30_000,
  logLevel: "silent",
};

const createHarness = () => {
  let serviceWorkerListener:
    | ((event: ServiceWorkerUpdateEvent) => void)
    | null = null;
  const activateUpdate = vi.fn().mockResolvedValue(undefined);
  const serviceWorkerManager = {
    isSupported: true,
    start: vi.fn((listener: (event: ServiceWorkerUpdateEvent) => void) => {
      serviceWorkerListener = listener;
    }),
    stop: vi.fn(),
    checkForUpdate: vi.fn().mockResolvedValue(undefined),
    activateUpdate,
  };
  const versionService = {
    getCurrentVersion: vi.fn(() => currentVersion),
    getRemoteVersion: vi.fn().mockResolvedValue(remoteVersion),
    isUpdateAvailable: vi.fn(() => true),
  };
  const manager = new UpdateManager(
    config,
    versionService as unknown as VersionService,
    serviceWorkerManager as never,
    new PWAUpdateLogger("silent"),
    window.localStorage,
  );

  return {
    activateUpdate,
    emitWaiting: () => serviceWorkerListener?.({ type: "waiting" }),
    manager,
  };
};

describe("PWAUpdateProvider explicit update contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("announces a waiting update without auto-activating the worker", async () => {
    const { activateUpdate, emitWaiting, manager } = createHarness();
    const accepted = vi.fn();
    window.addEventListener("app-update-accepted", accepted);

    manager.start();
    emitWaiting();

    await vi.waitFor(() => {
      expect(manager.getState().status).toBe("available");
    });
    expect(manager.getState().shouldNotify).toBe(true);
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(accepted).not.toHaveBeenCalled();

    window.removeEventListener("app-update-accepted", accepted);
    manager.stop();
  });

  it("keeps the active session unchanged when the user chooses Later", async () => {
    const { activateUpdate, emitWaiting, manager } = createHarness();
    const accepted = vi.fn();
    window.addEventListener("app-update-accepted", accepted);

    manager.start();
    emitWaiting();
    await vi.waitFor(() => {
      expect(manager.getState().shouldNotify).toBe(true);
    });

    manager.dismissUpdate();

    expect(manager.getState()).toMatchObject({
      status: "dismissed",
      isUpdateAvailable: true,
      shouldNotify: false,
    });
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(accepted).not.toHaveBeenCalled();

    window.removeEventListener("app-update-accepted", accepted);
    manager.stop();
  });

  it("activates only after the user explicitly chooses Update", async () => {
    const { activateUpdate, emitWaiting, manager } = createHarness();
    const accepted = vi.fn();
    window.addEventListener("app-update-accepted", accepted);

    manager.start();
    emitWaiting();
    await vi.waitFor(() => {
      expect(manager.getState().status).toBe("available");
    });

    expect(activateUpdate).not.toHaveBeenCalled();
    await manager.applyUpdate();

    expect(accepted).toHaveBeenCalledTimes(1);
    expect(activateUpdate).toHaveBeenCalledTimes(1);

    window.removeEventListener("app-update-accepted", accepted);
    manager.stop();
  });
});
