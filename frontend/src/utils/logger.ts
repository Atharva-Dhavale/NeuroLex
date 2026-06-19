/**
 * Simple logger utility for consistent logging across the application
 */

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Configure the current log level (can be changed at runtime)
let currentLogLevel = LogLevel.DEBUG; // Set to DEBUG by default in development

// Utility to format timestamps
const getTimestamp = () => new Date().toISOString();

// The logger object
export const logger = {
  /**
   * Set the current log level
   */
  setLevel: (level: LogLevel) => {
    currentLogLevel = level;
  },
  
  /**
   * Log an error message
   */
  error: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[${getTimestamp()}] [ERROR] ${message}`, ...args);
    }
  },
  
  /**
   * Log a warning message
   */
  warn: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[${getTimestamp()}] [WARN] ${message}`, ...args);
    }
  },
  
  /**
   * Log an informational message
   */
  info: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(`[${getTimestamp()}] [INFO] ${message}`, ...args);
    }
  },
  
  /**
   * Log a debug message
   */
  debug: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  },
};

// Set initial log level based on environment
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.INFO);
} 