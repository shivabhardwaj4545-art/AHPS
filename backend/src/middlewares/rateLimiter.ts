import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

// General API Rate Limiter: 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests from this IP address. Please try again after a minute.',
      undefined,
      429
    );
  },
});

// Strict Login Rate Limiter: 5 attempts per 15 minutes to prevent brute-force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many failed login attempts. Account temporarily locked for 15 minutes for security.',
      undefined,
      429
    );
  },
});

