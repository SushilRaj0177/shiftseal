import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/errors.js';

/** A signed-in person, from a verified Firebase ID token. */
export interface Identity {
  uid: string;
  phone?: string;
  email?: string;
  name?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    identity?: Identity;
  }
}

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

async function verifyFirebaseToken(token: string): Promise<Identity> {
  const config = getConfig();
  const projectId = config.FIREBASE_PROJECT_ID ?? config.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new AppError(500, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured.');
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error('Invalid subject');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time * 1000 > Date.now() + 60_000) {
    throw new Error('Invalid auth_time');
  }
  return {
    uid: payload.sub,
    phone: typeof payload.phone_number === 'string' ? payload.phone_number : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

/** Local development only: `dev:<uid>` or `dev:<uid>:<phone>`. Refused in production by config. */
function verifyDevToken(token: string): Identity {
  const m = /^dev:([A-Za-z0-9_-]{1,64})(?::(\+\d{8,15}))?$/.exec(token);
  if (!m) throw new Error('Invalid dev token');
  return { uid: m[1], phone: m[2] };
}

export async function verifyIdToken(token: string): Promise<Identity> {
  return getConfig().AUTH_MODE === 'dev' ? verifyDevToken(token) : verifyFirebaseToken(token);
}

/** Requires `Authorization: Bearer <Firebase ID token>`. */
export async function requireIdentity(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in.'));
    return;
  }
  try {
    req.identity = await verifyIdToken(token);
    next();
  } catch (err) {
    if (err instanceof AppError) next(err);
    else
      next(new AppError(401, 'UNAUTHENTICATED', 'Your sign-in has expired. Please sign in again.'));
  }
}
