class ExtendableError extends Error {
  constructor(message, status, isPublic) {
    super(message);

    this.name = this.constructor.name;

    this.message = message;

    this.status = status;

    this.isPublic = isPublic;

    this.isOperational = true;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

class APIError extends ExtendableError {
  constructor(message, status = 500, code = "INTERNAL_ERROR", isPublic = process.env.NODE_ENV !== "production") {
    super(message, status, isPublic);
    this.code = code;
  }
}

export const ERROR_CODES = {
  // Authentication (401)
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Authorization (403)
  FORBIDDEN: "FORBIDDEN",
  CSRF_VALIDATION_ERROR: "CSRF_VALIDATION_ERROR",
  CSRF_PROTECTION_ERROR: "CSRF_PROTECTION_ERROR",
  ORIGIN_CONFIG_ERROR: "ORIGIN_CONFIG_ERROR",
  MISSING_ORIGIN: "MISSING_ORIGIN",
  INVALID_ORIGIN: "INVALID_ORIGIN",

  // Not Found (404)
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Validation (400)
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_STATUS: "INVALID_STATUS",

  // Conflict (409)
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  USERNAME_TAKEN: "USERNAME_TAKEN",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server Errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
};

export default APIError;
