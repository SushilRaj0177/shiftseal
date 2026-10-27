import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errors.js';
import { verifySessionToken, type SessionClaims } from '../auth/session.js';

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

/** Limits powerful browser features: microphone and camera for this origin only. */
export function permissionsPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader(
    'Permissions-Policy',
    'microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
}

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

/**
 * Verifies the signed admin session (`Authorization: Bearer <token>`) and
 * attaches its claims. Role headers are never trusted.
 */
export function requireAdminRole(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  const claims = token ? verifySessionToken(token) : null;
  if (!claims) {
    next(new AppError(401, 'UNAUTHENTICATED', 'A valid administrator session is required.'));
    return;
  }
  res.locals.session = claims;
  next();
}

/** Ensures a workplace-scoped route is only read with a session for that workplace. */
export function requireWorkplaceScope(req: Request, res: Response, next: NextFunction): void {
  const claims = res.locals.session as SessionClaims | undefined;
  if (!claims || claims.workplaceId !== req.params.workplaceId) {
    next(new AppError(403, 'FORBIDDEN', 'This session is not authorised for that workplace.'));
    return;
  }
  next();
}
