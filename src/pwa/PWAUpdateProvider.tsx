import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { pwaUpdateConfig } from "./config";
import { PWAUpdateLogger } from "./logger";
import { ServiceWorkerManager } from "./ServiceWorkerManager";
import type { AppUpdateContextValue, AppUpdateState } from "./types";
import { UpdateManager } from "./UpdateManager";
import { VersionService } from "./VersionService";

const PWAUpdateContext = createContext<AppUpdateContextValue | null>(null);

const getBrowserStorage = () => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const PWAUpdateProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const manager = useMemo(() => {
    const logger = new PWAUpdateLogger(pwaUpdateConfig.logLevel);
    const versionService = new VersionService(
      pwaUpdateConfig.versionUrl,
      __APP_BUILD__,
    );
    const serviceWorkerManager = new ServiceWorkerManager(
      pwaUpdateConfig.serviceWorkerUrl,
      pwaUpdateConfig.serviceWorkerScope,
      pwaUpdateConfig.activationTimeoutMs,
      logger,
    );

    return new UpdateManager(
      pwaUpdateConfig,
      versionService,
      serviceWorkerManager,
      logger,
      getBrowserStorage(),
    );
  }, []);
  const [state, setState] = useState<AppUpdateState>(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    manager.start();

    return () => {
      unsubscribe();
      manager.stop();
    };
  }, [manager]);

  const value = useMemo<AppUpdateContextValue>(
    () => ({
      ...state,
      applyUpdate: () => manager.applyUpdate(),
      dismissUpdate: () => manager.dismissUpdate(),
      checkForUpdate: () => manager.checkForUpdate(),
    }),
    [manager, state],
  );

  return (
    <PWAUpdateContext.Provider value={value}>
      {children}
    </PWAUpdateContext.Provider>
  );
};

export const useAppUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (!context) {
    throw new Error("useAppUpdate must be used within PWAUpdateProvider");
  }

  return context;
};
