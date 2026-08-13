export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

const SAFE_CONTEXT_KEYS = new Set([
  'requestId', 'businessId', 'appointmentId', 'paymentId', 'provider',
  'status', 'statusCode', 'code', 'route', 'durationMs', 'errorName',
]);

function safeContext(context: LogContext = {}) {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key, value]) => SAFE_CONTEXT_KEYS.has(key) && (
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 200) : value])
  );
}

function write(level: LogLevel, event: string, context?: LogContext) {
  const entry = { level, event, context: safeContext(context), timestamp: new Date().toISOString() };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.info(JSON.stringify(entry));
}

export const logger = {
  debug: (event: string, context?: LogContext) => write('debug', event, context),
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) => write('error', event, context),
};
