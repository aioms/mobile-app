import { useEffect, useRef, useState } from "react";
import { useLoading, useStorage } from "@/hooks";
import { DEFAULT_XPRINTER_CONFIG } from "@/helpers/printerService";
import {
  DEFAULT_SCANNER_FEEDBACK,
  DEVICE_SETTINGS_STORAGE_KEY,
} from "@/helpers/deviceSettingsStorage";
import { DeviceSettings, PrinterSettings, ScannerSettings } from "../types";

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  printer: {
    ipAddress: DEFAULT_XPRINTER_CONFIG.ipAddress,
    port: DEFAULT_XPRINTER_CONFIG.port,
    timeout: DEFAULT_XPRINTER_CONFIG.timeout,
    barcodeLayout: "auto-pair",
    paperWidth: 76,
    paperHeight: 22,
  },
  scanner: { ...DEFAULT_SCANNER_FEEDBACK },
  updatedAt: "",
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;

const readBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const readNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

/**
 * Merge persisted data over the defaults so older builds (or partial writes)
 * never leave a section undefined.
 */
export const normalizeDeviceSettings = (raw: unknown): DeviceSettings => {
  const root = asRecord(raw) ?? {};
  const printer = asRecord(root.printer) ?? {};
  const scanner = asRecord(root.scanner) ?? {};
  const defaults = DEFAULT_DEVICE_SETTINGS;

  return {
    printer: {
      ipAddress: readString(printer.ipAddress, defaults.printer.ipAddress),
      port: Math.round(readNumber(printer.port, defaults.printer.port, 1, 65535)),
      timeout: Math.round(
        readNumber(printer.timeout, defaults.printer.timeout, 500, 60000)
      ),
      barcodeLayout: printer.barcodeLayout === "single" ? "single" : "auto-pair",
      paperWidth: readNumber(
        printer.paperWidth,
        defaults.printer.paperWidth,
        20,
        120
      ),
      paperHeight: readNumber(
        printer.paperHeight,
        defaults.printer.paperHeight,
        10,
        150
      ),
    },
    scanner: {
      hapticsEnabled: readBoolean(
        scanner.hapticsEnabled,
        defaults.scanner.hapticsEnabled
      ),
      soundEnabled: readBoolean(
        scanner.soundEnabled,
        defaults.scanner.soundEnabled
      ),
    },
    updatedAt: readString(root.updatedAt, ""),
  };
};

export const useDeviceSettings = () => {
  const { getItem, addItem } = useStorage();
  const { isLoading: isSaving, withLoading } = useLoading();
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULT_DEVICE_SETTINGS);
  const settingsRef = useRef(settings);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const reload = async () => {
    setIsInitialLoading(true);
    try {
      const stored = await getItem(DEVICE_SETTINGS_STORAGE_KEY);
      const normalized = normalizeDeviceSettings(stored);
      settingsRef.current = normalized;
      setSettings(normalized);
    } catch (error) {
      console.error("Không thể đọc cài đặt thiết bị:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const patchSettings = (
    updater: (current: DeviceSettings) => DeviceSettings
  ) =>
    withLoading(async () => {
      const stamped: DeviceSettings = {
        ...updater(settingsRef.current),
        updatedAt: new Date().toISOString(),
      };
      await addItem(DEVICE_SETTINGS_STORAGE_KEY, stamped);
      settingsRef.current = stamped;
      setSettings(stamped);
    });

  const updatePrinterSettings = (patch: Partial<PrinterSettings>) =>
    patchSettings((current) => ({
      ...current,
      printer: { ...current.printer, ...patch },
    }));

  const updateScannerSettings = (patch: Partial<ScannerSettings>) =>
    patchSettings((current) => ({
      ...current,
      scanner: { ...current.scanner, ...patch },
    }));

  return {
    settings,
    isInitialLoading,
    isSaving,
    reload,
    updatePrinterSettings,
    updateScannerSettings,
  };
};
