import { canonicalJSON } from './ledger/ledger.js';
import type { PublicKeyJwk } from './model.js';

/**
 * Device signatures. Each worker's phone holds a non-extractable ECDSA P-256
 * key; every check-in and check-out is signed on the phone before it is sent.
 * The same code verifies signatures in the browser and on the server.
 */

const ALG = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGN_ALG = { name: 'ECDSA', hash: 'SHA-256' } as const;

// Typed from the runtime so this file compiles for both the browser and Node.
type Subtle = typeof globalThis.crypto.subtle;
export type DeviceKey = Awaited<ReturnType<Subtle['importKey']>>;
export interface DeviceKeyPair {
  privateKey: DeviceKey;
  publicKey: DeviceKey;
}

function subtle(): Subtle {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('WebCrypto is not available');
  return s;
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function generateDeviceKey(): Promise<DeviceKeyPair> {
  return (await subtle().generateKey(ALG, false, ['sign', 'verify'])) as DeviceKeyPair;
}

export async function exportPublicJwk(key: DeviceKey): Promise<PublicKeyJwk> {
  const jwk = await subtle().exportKey('jwk', key);
  return { kty: jwk.kty ?? 'EC', crv: jwk.crv, x: jwk.x, y: jwk.y };
}

export async function signPayload(privateKey: DeviceKey, payload: unknown): Promise<string> {
  const data = new TextEncoder().encode(canonicalJSON(payload));
  const sig = await subtle().sign(SIGN_ALG, privateKey, data);
  return toBase64Url(new Uint8Array(sig));
}

export async function verifyPayload(
  publicJwk: PublicKeyJwk,
  payload: unknown,
  signature: string
): Promise<boolean> {
  try {
    if (publicJwk.kty !== 'EC' || publicJwk.crv !== 'P-256') return false;
    const key = await subtle().importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', x: publicJwk.x, y: publicJwk.y },
      ALG,
      false,
      ['verify']
    );
    const data = new TextEncoder().encode(canonicalJSON(payload));
    return await subtle().verify(SIGN_ALG, key, fromBase64Url(signature), data);
  } catch {
    return false;
  }
}
