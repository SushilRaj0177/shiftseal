import { createHash, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod/v3';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/errors.js';

/**
 * Private demo links. Each link carries a long random token; the server keeps
 * only its SHA-256 (DEMO_LINKS) and, on a match, signs that one demo account
 * in. Without the exact token there is nothing to find: wrong tokens get the
 * same 404 as no demo at all, and attempts are rate-limited.
 */
export const demoRouter = Router();

const bodySchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/) });

interface DemoLink {
  hash: Buffer;
  uid: string;
  lang?: string;
}

export function parseDemoLinks(raw: string | undefined): DemoLink[] {
  if (!raw) return [];
  return raw.split(',').map((entry) => {
    const [hash, uid, lang] = entry.split(':');
    return { hash: Buffer.from(hash!, 'hex'), uid: uid!, lang };
  });
}

export function findDemoLink(token: string, links: DemoLink[]): DemoLink | undefined {
  const h = createHash('sha256').update(token).digest();
  // Compare against every entry, in constant time each, so timing says nothing.
  let found: DemoLink | undefined;
  for (const l of links) if (timingSafeEqual(h, l.hash)) found = l;
  return found;
}

const METADATA =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default';

/**
 * A Firebase custom token for `uid`, signed by the service's own Google service
 * account through the IAM Credentials API (no key file). The account needs the
 * Service Account Token Creator role on itself.
 */
async function mintCustomToken(uid: string): Promise<string> {
  const headers = { 'Metadata-Flavor': 'Google' };
  const [email, tokenRes] = await Promise.all([
    fetch(`${METADATA}/email`, { headers }).then((r) => r.text()),
    fetch(`${METADATA}/token`, { headers }).then(
      (r) => r.json() as Promise<{ access_token: string }>
    ),
  ]);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    sub: email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
  };
  const res = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${email}:signJwt`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenRes.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: JSON.stringify(payload) }),
    }
  );
  if (!res.ok) throw new AppError(503, 'DEMO_UNAVAILABLE', 'Demo sign-in is not set up yet.');
  return ((await res.json()) as { signedJwt: string }).signedJwt;
}

demoRouter.post('/session', async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    const link = parsed.success
      ? findDemoLink(parsed.data.token, parseDemoLinks(getConfig().DEMO_LINKS))
      : undefined;
    if (!link) throw new AppError(404, 'NOT_FOUND', 'This link does not work.');
    res.setHeader('Cache-Control', 'no-store');
    if (getConfig().AUTH_MODE === 'dev') {
      res.json({ devUid: link.uid, lang: link.lang ?? null });
      return;
    }
    res.json({ customToken: await mintCustomToken(link.uid), lang: link.lang ?? null });
  } catch (err) {
    next(err);
  }
});
