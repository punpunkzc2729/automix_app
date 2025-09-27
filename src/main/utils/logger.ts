/* Simple timestamped logger for the main process */
export const logger = {
  info(message: string, payload?: unknown) {
    console.info(`[automix] ${new Date().toISOString()} INFO: ${message}`, payload ?? "");
  },
  warn(message: string, payload?: unknown) {
    console.warn(`[automix] ${new Date().toISOString()} WARN: ${message}`, payload ?? "");
  },
  error(message: string, payload?: unknown) {
    console.error(`[automix] ${new Date().toISOString()} ERROR: ${message}`, payload ?? "");
  }
};
