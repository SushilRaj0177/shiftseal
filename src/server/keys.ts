import {
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  verify,
} from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { canonicalJSON } from '../shared/ledger/ledger.js';
import { getConfig } from './config.js';

/**
 * All server secrets derive from SESSION_SECRET, so there is one value to
 * protect and rotate. Without it (local development) a random per-process
 * secret is used.
 */

let master: Buffer | null = null;

function masterSecret(): Buffer {
  if (!master) {
    const s = getConfig().SESSION_SECRET;
    master = s ? Buffer.from(s, 'utf8') : randomBytes(32);
  }
  return master;
}

export function deriveSecret(label: string): Buffer {
  return createHmac('sha256', masterSecret()).update(label).digest();
}

export function qrSecret(workplaceId: string): Buffer {
  return deriveSecret(`qr:v1:${workplaceId}`);
}

// Ed25519 receipt key, derived deterministically so every instance signs with the same key.
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
let receiptKey: { priv: KeyObject; pub: KeyObject } | null = null;

function receiptKeys(): { priv: KeyObject; pub: KeyObject } {
  if (!receiptKey) {
    const seed = deriveSecret('receipt-signing:v1');
    const priv = createPrivateKey({
      key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
      format: 'der',
      type: 'pkcs8',
    });
    receiptKey = { priv, pub: createPublicKey(priv) };
  }
  return receiptKey;
}

export function signReceipt(payload: unknown): string {
  return sign(null, Buffer.from(canonicalJSON(payload)), receiptKeys().priv).toString('base64url');
}

export function verifyReceipt(payload: unknown, sig: string): boolean {
  try {
    return verify(
      null,
      Buffer.from(canonicalJSON(payload)),
      receiptKeys().pub,
      Buffer.from(sig, 'base64url')
    );
  } catch {
    return false;
  }
}

export function receiptPublicJwk(): Record<string, unknown> {
  return receiptKeys().pub.export({ format: 'jwk' }) as Record<string, unknown>;
}

/** Tests only. */
export function resetKeys(): void {
  master = null;
  receiptKey = null;
}
