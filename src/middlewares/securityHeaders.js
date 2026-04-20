export function securityHeaders(options = {}) {
  const {
    isDevelopment = process.env.NODE_ENV === "development",
    allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"],
    enableCSP = false,
  } = options;
  return [
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },

      xContentTypeOptions: true, // X-Content-Type-Options: nosniff
      frameguard: { action: "deny" }, // X-Frame-Options: DENY

      // HTTP Strict Transport Security (HSTS)
      hsts: isDevelopment
        ? false
        : {
            maxAge: 63072000, // 2 years in seconds
            includeSubDomains: true,
            preload: true,
          },

      // Expect-CT header (deprecated but still useful for older browsers)
      expectCt: isDevelopment ? false : { maxAge: 86400, enforce: true },

      // Referrer Policy - control referrer information
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },

      // DNS Prefetch Control - prevent DNS prefetching
      dnsPrefetchControl: { allow: false },

      // Permitted Cross-Domain Policies (for Adobe products)
      permittedCrossDomainPolicies: { permittedPolicies: "none" },

      // X-Download-Options for IE8+
      ieNoOpen: true,

      // Hide X-Powered-By header (already set in express, but helmet ensures it)
      hidePoweredBy: true,

      // Content Security Policy
      contentSecurityPolicy: enableCSP
        ? {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
              manifestSrc: ["'self'"],
              objectSrc: ["'none'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline for inline styles if needed
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              mediaSrc: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    }),

    // Custom Permissions-Policy header (replaces Feature-Policy)
    (req, res, next) => {
      res.setHeader(
        "Permissions-Policy",
        [
          "geolocation=()",
          "microphone=()",
          "camera=()",
          "payment=()",
          "usb=()",
          "magnetometer=()",
          "gyroscope=()",
          "accelerometer=()",
          "ambient-light-sensor=()",
          "autoplay=()",
          "encrypted-media=()",
          "fullscreen=(self)",
          "picture-in-picture=()",
        ].join(", "),
      );
      next();
    },
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (same-origin requests, mobile apps, Postman, etc.)
        if (!origin) {
          // Same-origin requests don't send Origin header - these should be allowed
          // This is the case when frontend and backend are on the same domain
          return callback(null, true);
        }

        if (isDevelopment) {
          // Allow all origins in development (Hoppscotch, Postman web, etc.)
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS policy"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cache-Control", "X-CSRF-Token"],
      exposedHeaders: ["Content-Range", "X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"],
      maxAge: 86400, // Cache preflight for 24 hours
    }),
    hpp(),
  ];
}
