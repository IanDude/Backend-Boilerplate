import { rateLimit } from "express-rate-limit";
import { ERROR_CODES } from "../util/APIError.js";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 Minutes
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res) => {
    res.sendError("Number of requests exceeds limit, try again later", null, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  },
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res) => {
    res.sendError("Too many login attempts, please try again later.", null, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, //60 minutes
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res) => {
    res.sendError("Too many accounts created, try again later", null, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  },
});

export const usersRouteLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, //30 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res) => {
    res.sendError("Too many user requests, try again later", null, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  },
});
