import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Firebase phone sign-in uses an invisible reCAPTCHA.
      scriptSrc: [
        "'self'",
        'https://www.google.com/recaptcha/',
        'https://www.gstatic.com/recaptcha/',
        'https://apis.google.com',
      ],
      frameSrc: [
        "'self'",
        'https://www.google.com/recaptcha/',
        'https://recaptcha.google.com/recaptcha/',
        'https://*.firebaseapp.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.google.com/recaptcha/',
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/** Limits powerful browser features: microphone, camera and location for this origin only. */
export function permissionsPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader(
    'Permissions-Policy',
    'microphone=(self), camera=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()'
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

/** Invite codes are short, so guessing them is rate limited separately. */
export const inviteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many attempts. Please wait a few minutes.',
  },
});
