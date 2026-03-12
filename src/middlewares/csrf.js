import { doubleCsrf } from "csrf-csrf";
import crypto from "node:crypto";
import APIError, { ERROR_CODES } from "../util/APIError.js";

const csrfSecret = process.env.CSRF_SECRET;

//Cookie Configuration

const isProduction = process.env.NODE_ENV === "production";
const allowCrossSite = process.env.ALLOW_CROSS_SITE_CSRF === "true";
const forceSecure = process.env.COOKIE_SECURE === "true";

if (!csrfSecret && isProduction) {
  throw new Error("CSRF_SECRET must be set in production environment");
}

/**
 * Determine cookie settings based on environment
 *
 * | Scenario                  | sameSite | secure | Notes                          |
 * |---------------------------|----------|--------|--------------------------------|
 * | Production (same-origin)  | strict   | true   | Maximum security               |
 * | Hybrid (cross-site HTTPS) | none     | true   | Requires credentials: include  |
 * | Local dev (same-origin)   | lax      | false  | Standard dev setup             |
 * | Local dev (cross-origin)  | lax      | false  | Won't work! Use DISABLE_CSRF   |
 */

const getCookieConfig = () => {
  // Cross-site requests (Scenario 2: frontend HTTP, backend HTTPS)
  if (allowCrossSite) {
    if (!forceSecure && !isProduction) {
      console.warn(
        "⚠️  ALLOW_CROSS_SITE_CSRF=true requires COOKIE_SECURE=true or HTTPS backend. " +
          "Cross-origin cookies will NOT work over HTTP. Use DISABLE_CSRF=true for local HTTP dev.",
      );
    }
    return {
      sameSite: "none",
      secure: true,
    };
  }
  // Production same-origin (Scenario 3)
  if (isProduction) {
    return {
      sameSite: "strict",
      secure: true,
    };
  }

  return {
    sameSite: "lax",
    secure: forceSecure,
  };
};

const cookieConfig = getCookieConfig();
// Use __Host- prefix only in production (requires HTTPS and path=/)
const cookieName = isProduction ? "__Host-csrf" : "csrf-token";

const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier: (req) => {
    if (req?.session?.id || req.sessionID) {
      const sessionId = req?.session?.id || req.sessionID;
      if (!isProduction) {
        console.log("CSRF session identifier (session:", sessionId.substring(0, 10) + "...");
      }
      return sessionId;
    }

    // Fallback: Generate a session identifier from IP and User-Agent
    // This provides reasonable CSRF protection without requiring express-session

    const userAgent = req.get("user-agent") || "unknown";
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const identifier = `${ip}-${userAgent}`;

    const hash = crypto.createHash("sha256").update(identifier).digest("hex");
    if (!isProduction) {
      console.log("CSRF session identifier (fallback):", {
        ip,
        uaStart: userAgent.substring(0, 30),
        hash: hash.substring(0, 10),
      });
    }
    return hash;
  },
  cookieName,
  cookieOptions: {
    ...cookieConfig,
    path: "/",
    httpOnly: true,
    maxAge: 3600000,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) => {
    const token = req.headers["x-csrf-token"] || req.headers["x-xsrf-token"] || req.body?._csrf || req.query?._csrf;
    if (!isProduction) {
      console.log("CSRF token from request:", token ? token.substring(0, 20) + "..." : "none");
    }
    return token;
  },
});

/**
 * CSRF Protection Middleware
 * Apply this to routes that need CSRF protection
 *
 * To disable CSRF in development for testing (e.g., Postman), set:
 * DISABLE_CSRF=true in your .env file
 */

const isCsrfDisabled = process.env.DISABLE_CSRF === "true";
export const csrfProtection = (req, res, next) => {
  if (isProduction && isCsrfDisabled) {
    throw new APIError("CSRF protection cannot be disabled in production", 500, ERROR_CODES.CSRF_PROTECTION_ERROR);
  }

  if (!isProduction && isCsrfDisabled) {
    console.warn("CSRF protection disabled in non-production environment");
    return next();
  }
  // Skip CSRF for browser extensions in development (cookies don't work well)
  if (!isProduction) {
    const origin = req.get("origin") || req.get("referer");
    if (
      origin &&
      (origin.startsWith("chrome-extension://") ||
        origin.startsWith("moz-extension://") ||
        origin.startsWith("safari-extension://") ||
        origin.startsWith("ms-browser-extension://"))
    ) {
      console.info("Skipping CSRF validation for browser extension in development", {
        origin,
        method: req.method,
        url: req.originalUrl,
      });
      return next();
    }
  }

  const wrappedNext = (err) => {
    if (err && !isProduction) {
      const debugInfo = {
        error: err.message,
        code: err.code,
        hasToken: !!req.headers["x-csrf-token"],
        tokenValue: req.headers["x-csrf-token"]?.substring(0, 20) + "...",
        hasCookie: !!req.cookies?.["csrf-token"] || !!req.cookies?.["__Host-csrf"],
        cookieValue: (req.cookies?.["csrf-token"] || req.cookies?.["__Host-csrf"])?.substring(0, 20) + "...",
        cookies: Object.keys(req.cookies || {}),
        method: req.method,
        url: req.originalUrl,
        sessionId: req.session?.id || req.sessionID || "no-session",
      };
      console.log("CSRF validation error details:", debugInfo);
    }
    next(err);
  };

  return doubleCsrfProtection(req, res, wrappedNext);
};

/**
 * Generate CSRF Token
 * Use this to create tokens for the frontend
 */
export const generateCsrfToken = generateToken;

/**
 * CSRF Token Generation Endpoint Handler
 * Creates a route that returns CSRF tokens to the frontend
 */

export const csrfTokenHandler = (req, res) => {
  const token = generateToken(req, res);
  return res.sendSuccess("CSRF token generated. Include this in x-csrf-token header for state-changing requests.", {
    csrfToken: token,
  });
};

/**
 * Error handler for CSRF validation failures
 */

export const csrfErrorHandler = (err, req, res, next) => {
  const isCsrfError =
    err.code === "EBADCSRFTOKEN" ||
    err.message?.toLowerCase().includes("csrf") ||
    err.message?.toLowerCase().includes("invalid csrf token");

  if (isCsrfError) {
    console.warn("CSRF validation failed", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      errorMessage: err.message,
    });

    // Make sure response hasn't been sent already

    if (res.headersSent) {
      console.error("ERROR: Headers already sent, cannot send 403 response");
      return next(err);
    }

    console.log("Sending 403 CSRF error response...");

    try {
      res.sendError(
        "Invalid or expired CSRF token. Please refresh and try again.",
        null,
        403,
        ERROR_CODES.CSRF_VALIDATION_ERROR,
      );
      console.log("403 response sent successfully");
    } catch (repsonseError) {
      console.error("ERROR: Failed to send 403 response:", repsonseError);
      console.error("Response error stack:", repsonseError.stack);
      // If sending 403 fails, pass error to next handler (will become 500)
      return next(repsonseError);
    }
  }

  console.log("Not a CSRF error, passing to next handler...");
  console.log("=== CSRF Error Handler ===");
  next(err);
};
/**
 * Origin Validation Middleware
 * Additional security layer to validate request origin
 * Use this before CSRF protection for defense in depth
 *
 * Environment Variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "http://localhost:3000,https://app.example.com")
 * - FRONTEND_URL: Single frontend URL (legacy support)
 * - PRODUCTION_URL: Production URL (legacy support)
 */
export const validateOrigin = (req, res, next) => {
  // Build allowed origins list from environment variables
  let allowedOrigins = [];

  // Primary method: Use ALLOWED_ORIGINS env variable (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins = process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  } else {
    // Fallback: Use legacy env variables + development defaults
    const devDefaults =
      process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:4200"]
        : [];

    allowedOrigins = [...devDefaults, process.env.FRONTEND_URL, process.env.PRODUCTION_URL].filter(Boolean);
  }

  // Log allowed origins in development for debugging
  if (process.env.NODE_ENV === "development" && allowedOrigins.length > 0) {
    console.info("Allowed origins for CSRF validation", {
      allowedOrigins,
      configuredVia: process.env.ALLOWED_ORIGINS ? "ALLOWED_ORIGINS" : "legacy env vars",
    });
  }

  // Only validate for state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin") || req.get("referer");
  // If no allowed origins are configured, allow all in development, block all in production
  if (allowedOrigins.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("No allowed origins configured - allowing all requests in development mode");
      return next();
    } else {
      console.error("No allowed origins configured in production - blocking request", {
        origin,
        method: req.method,
        url: req.originalUrl,
      });
      return res.sendError("Origin validation not configured", null, 403, ERROR_CODES.ORIGIN_CONFIG_ERROR);
    }
  }

  // Check if origin/referer exists
  if (!origin) {
    // Same-origin requests may not include Origin header
    // Check if Host header matches any allowed origin (same-server scenario)
    const host = req.get("host");
    if (host) {
      const isSameOrigin = allowedOrigins.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed);
          return allowedUrl.host === host;
        } catch {
          return false;
        }
      });

      if (isSameOrigin) {
        console.info("Allowing same-origin request (no Origin header, Host matches allowed origin)", {
          host,
          method: req.method,
          url: req.originalUrl,
        });
        return next();
      }
    }

    console.warn("Request missing origin/referer header", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      host,
      userAgent: req.get("user-agent"),
    });

    // In development, allow requests without origin (for tools like Postman)
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    return res.sendError("Request origin validation failed", null, 403, ERROR_CODES.MISSING_ORIGIN);
  }

  // Allow Chrome extensions and browser extensions in development
  if (process.env.NODE_ENV === "development") {
    if (
      origin.startsWith("chrome-extension://") ||
      origin.startsWith("moz-extension://") ||
      origin.startsWith("safari-extension://") ||
      origin.startsWith("ms-browser-extension://")
    ) {
      console.info("Allowing browser extension origin in development", {
        origin,
        method: req.method,
        url: req.originalUrl,
      });
      return next();
    }
  }

  // Validate origin is in allowed list
  try {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      console.warn("Invalid origin detected", {
        origin,
        allowedOrigins,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      // In development, provide helpful error message
      const message =
        process.env.NODE_ENV === "development"
          ? `Origin '${origin}' not allowed. Allowed origins: ${allowedOrigins.join(", ")}`
          : "Request origin not allowed";

      return res.sendError(message, null, 403, ERROR_CODES.INVALID_ORIGIN);
    }

    next();
  } catch (error) {
    console.error("Origin validation error", {
      origin,
      error: error.message,
    });

    return res.sendError("Invalid request origin", null, 403, ERROR_CODES.INVALID_ORIGIN);
  }
};
