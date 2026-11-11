import { storage } from "@/hooks/useStorage";

/**
 * Single source of truth for the persisted device-settings key. The Settings
 * screen writes it; scan feedback reads it on every successful scan.
 */
export const DEVICE_SETTINGS_STORAGE_KEY = "aiom_device_settings";

export interface ScannerFeedbackPreferences {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_SCANNER_FEEDBACK: ScannerFeedbackPreferences = {
  hapticsEnabled: true,
  soundEnabled: false,
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

export const parseScannerFeedback = (
  raw: unknown
): ScannerFeedbackPreferences => {
  const record = asRecord(raw) ?? {};
  return {
    hapticsEnabled:
      typeof record.hapticsEnabled === "boolean"
        ? record.hapticsEnabled
        : DEFAULT_SCANNER_FEEDBACK.hapticsEnabled,
    soundEnabled:
      typeof record.soundEnabled === "boolean"
        ? record.soundEnabled
        : DEFAULT_SCANNER_FEEDBACK.soundEnabled,
  };
};

/**
 * Read the scanner feedback preferences persisted by the Settings screen.
 * Storage values may be stored as JSON strings (see `useStorage.addItem`).
 */
export const readScannerFeedbackPreferences =
  async (): Promise<ScannerFeedbackPreferences> => {
    try {
      const raw = await storage.get(DEVICE_SETTINGS_STORAGE_KEY);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const settings = asRecord(parsed);
      return parseScannerFeedback(settings?.scanner);
    } catch (error) {
      console.warn("Không đọc được cài đặt phản hồi khi quét:", error);
      return DEFAULT_SCANNER_FEEDBACK;
    }
  };

/**
 * Short confirmation beep for a successful barcode scan.
 */
export const playScanBeep = (): void => {
  if (typeof window === "undefined" || !window.AudioContext) return;

  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 1200;
    gain.gain.setValueAtTime(0.12, context.currentTime);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Audio output is unavailable on this device; scanning continues silently.
  }
};
