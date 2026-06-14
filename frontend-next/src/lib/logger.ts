export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export function log(level: LogLevel, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, data };

  switch (level) {
    case LogLevel.ERROR:
      console.error(JSON.stringify(logEntry));
      break;
    case LogLevel.WARN:
      console.warn(JSON.stringify(logEntry));
      break;
    case LogLevel.DEBUG:
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

export function logError(message: string, error: unknown) {
  log(LogLevel.ERROR, message, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export function logInfo(message: string, data?: unknown) {
  log(LogLevel.INFO, message, data);
}

export function logWarn(message: string, data?: unknown) {
  log(LogLevel.WARN, message, data);
}
