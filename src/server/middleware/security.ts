import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errors.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many AI requests. Please wait a moment and try again.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please slow down.',
  },
});

export function requireAdminRole(req: Request, _res: Response, next: NextFunction): void {
  const role = req.header('x-shiftseal-role');
  if (role !== 'admin') {
    next(new AppError(403, 'FORBIDDEN', 'Administrator access is required for this action.'));
    return;
  }
  next();
}
