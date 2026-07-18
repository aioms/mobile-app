import type { UpdateLogLevel } from "./types";

const LOG_LEVEL_PRIORITY: Record<UpdateLogLevel, number> = {
  silent: 0,
  error: 1,
  info: 2,
  debug: 3,
};

export class PWAUpdateLogger {
  constructor(private readonly level: UpdateLogLevel) {}

  error(message: string, details?: unknown) {
    if (!this.shouldLog("error")) return;
    console.error(`[PWA Update] ${message}`, details ?? "");
  }

  info(message: string, details?: unknown) {
    if (!this.shouldLog("info")) return;
    console.info(`[PWA Update] ${message}`, details ?? "");
  }

  debug(message: string, details?: unknown) {
    if (!this.shouldLog("debug")) return;
    console.debug(`[PWA Update] ${message}`, details ?? "");
  }

  private shouldLog(level: UpdateLogLevel) {
    return LOG_LEVEL_PRIORITY[this.level] >= LOG_LEVEL_PRIORITY[level];
  }
}
