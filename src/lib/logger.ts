/**
 * Structured logger. Emits single-line JSON so the Worker log aggregator
 * can index by shop, request, and event.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  shopId?: string;
  userId?: string;
  requestId?: string;
  route?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...context,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
  child(bound: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) =>
        emit("debug", msg, { ...bound, ...ctx }),
      info: (msg: string, ctx?: LogContext) =>
        emit("info", msg, { ...bound, ...ctx }),
      warn: (msg: string, ctx?: LogContext) =>
        emit("warn", msg, { ...bound, ...ctx }),
      error: (msg: string, ctx?: LogContext) =>
        emit("error", msg, { ...bound, ...ctx }),
    };
  },
};
