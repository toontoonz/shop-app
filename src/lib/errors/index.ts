/**
 * Custom error hierarchy for the application.
 * apiHandler maps these to structured JSON responses with appropriate HTTP status codes.
 */

export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly fields?: Record<string, string>;

  constructor(code: string, message: string, httpStatus: number, fields?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.fields = fields;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super("VALIDATION_ERROR", message, 400, fields);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message = "Invalid status transition") {
    super("INVALID_TRANSITION", message, 409);
    this.name = "InvalidTransitionError";
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = "สินค้าบางรายการมีจำนวนคงเหลือไม่พอ", fields?: Record<string, string>) {
    super("INSUFFICIENT_STOCK", message, 409, fields);
    this.name = "InsufficientStockError";
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง") {
    super("RATE_LIMITED", message, 429);
    this.name = "RateLimitedError";
  }
}
