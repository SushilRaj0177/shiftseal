import { isAndroidApp } from './native.js';
import {
  exportPublicJwk,
  generateDeviceKey,
  signPayload,
  type DeviceKeyPair,
} from '../../shared/signing.js';
import { api } from './api.js';

/**
 * This phone's signing key. It is generated once, cannot be exported, and is
 * kept in IndexedDB; the server only ever sees the public half.
 */

const DB = 'shiftseal';
const STORE = 'keys';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

interface StoredDevice {
  deviceId: string;
  keys: DeviceKeyPair;
}

let cached: StoredDevice | null = null;

export async function getDevice(): Promise<StoredDevice> {
  if (cached) return cached;
  const existing = await idb<StoredDevice | undefined>('readonly', (s) => s.get('device'));
  if (existing) return (cached = existing);
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const deviceId = 'd' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const device = { deviceId, keys: await generateDeviceKey() };
  await idb('readwrite', (s) => s.put(device, 'device'));
  return (cached = device);
}

export function platform(): 'android' | 'web' {
  return isAndroidApp() ? 'android' : 'web';
}

/** Registers this phone with a workplace. Returns `pending` if another phone is already bound. */
export async function registerDevice(workplaceId: string): Promise<'bound' | 'pending'> {
  const d = await getDevice();
  const res = await api<{ status: 'bound' | 'pending' }>(`/workplaces/${workplaceId}/device`, {
    body: {
      deviceId: d.deviceId,
      platform: platform(),
      publicKeyJwk: await exportPublicJwk(d.keys.publicKey),
    },
  });
  return res.status;
}

export async function sign(payload: unknown): Promise<string> {
  const d = await getDevice();
  return signPayload(d.keys.privateKey, payload);
}

export function nonce(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
