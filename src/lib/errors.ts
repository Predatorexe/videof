/** Domain error hierarchy. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, "RATE_LIMITED", 429);
  }
}
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", 502, details);
  }
}

/** Convert any thrown value to a safe { code, status, message } DTO. */
export function toErrorDTO(err: unknown) {
  if (err instanceof AppError) {
    return { code: err.code, status: err.status, message: err.message };
  }
  if (err instanceof Error) {
    return { code: "INTERNAL_ERROR", status: 500, message: err.message };
  }
  return { code: "INTERNAL_ERROR", status: 500, message: "Unknown error" };
}
