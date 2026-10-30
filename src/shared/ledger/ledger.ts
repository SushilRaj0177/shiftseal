import type {
  LedgerEvent,
  LedgerEventType,
  LedgerCheckInPayload,
  LedgerCheckOutPayload,
  LedgerEditPayload,
  ShiftRecord,
} from '../types.js';

export type UnsignedLedgerEvent = Omit<LedgerEvent, 'hash'>;

export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJSON(item)).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(obj[k])}`).join(',') + '}';
}

// Pure JS/TS SHA-256 implementation so both Node and browser can compute synchronous deterministic hashes
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256Hex(ascii: string): string {
  const bytes = new TextEncoder().encode(ascii);
  const bitLen = bytes.length * 8;

  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, '0')).join('');
}

export async function sha256HexAsync(ascii: string): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const data = new TextEncoder().encode(ascii);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return sha256Hex(ascii);
}

export function computeEventHash(eventWithoutHash: UnsignedLedgerEvent): string {
  const serialized = canonicalJSON({
    id: eventWithoutHash.id,
    workerId: eventWithoutHash.workerId,
    type: eventWithoutHash.type,
    createdAt: eventWithoutHash.createdAt,
    payload: eventWithoutHash.payload,
    prevHash: eventWithoutHash.prevHash,
  });
  return sha256Hex(eventWithoutHash.prevHash + serialized);
}

export function append(
  chain: LedgerEvent[],
  params: {
    id: string;
    workerId: string;
    type: LedgerEventType;
    createdAt: string;
    payload: LedgerEvent['payload'];
  }
): LedgerEvent[] {
  const prevHash = chain.length === 0 ? 'GENESIS' : chain[chain.length - 1].hash;
  const unsigned: UnsignedLedgerEvent = {
    id: params.id,
    workerId: params.workerId,
    type: params.type,
    createdAt: params.createdAt,
    payload: params.payload,
    prevHash,
  };
  const hash = computeEventHash(unsigned);
  return [...chain, { ...unsigned, hash }];
}

export function verify(chain: LedgerEvent[]): { ok: true } | { ok: false; brokenAt: number } {
  for (let i = 0; i < chain.length; i++) {
    const ev = chain[i];
    const expectedPrev = i === 0 ? 'GENESIS' : chain[i - 1].hash;
    if (ev.prevHash !== expectedPrev) {
      return { ok: false, brokenAt: i };
    }
    const expectedHash = computeEventHash({
      id: ev.id,
      workerId: ev.workerId,
      type: ev.type,
      createdAt: ev.createdAt,
      payload: ev.payload,
      prevHash: ev.prevHash,
    });
    if (ev.hash !== expectedHash) {
      return { ok: false, brokenAt: i };
    }
  }
  return { ok: true };
}

export async function verifyAsync(
  chain: LedgerEvent[]
): Promise<{ ok: true } | { ok: false; brokenAt: number }> {
  for (let i = 0; i < chain.length; i++) {
    const ev = chain[i];
    const expectedPrev = i === 0 ? 'GENESIS' : chain[i - 1].hash;
    if (ev.prevHash !== expectedPrev) {
      return { ok: false, brokenAt: i };
    }
    const serialized = canonicalJSON({
      id: ev.id,
      workerId: ev.workerId,
      type: ev.type,
      createdAt: ev.createdAt,
      payload: ev.payload,
      prevHash: ev.prevHash,
    });
    const expectedHash = await sha256HexAsync(ev.prevHash + serialized);
    if (ev.hash !== expectedHash) {
      return { ok: false, brokenAt: i };
    }
  }
  return { ok: true };
}

export function latestView(chain: LedgerEvent[]): ShiftRecord[] {
  const shiftsByDate = new Map<string, ShiftRecord>();
  const eventToShiftDate = new Map<string, { date: string; kind: 'in' | 'out' }>();

  for (const ev of chain) {
    if (ev.type === 'CHECK_IN') {
      const p = ev.payload as LedgerCheckInPayload;
      const record: ShiftRecord = {
        date: p.date,
        workerId: ev.workerId,
        checkInEventId: ev.id,
        checkInTime: p.timestamp,
        originalCheckInTime: p.timestamp,
        zoneCode: p.zoneCode,
        source: p.source ?? 'qr',
        edits: [],
      };
      shiftsByDate.set(p.date, record);
      eventToShiftDate.set(ev.id, { date: p.date, kind: 'in' });
    } else if (ev.type === 'CHECK_OUT') {
      const p = ev.payload as LedgerCheckOutPayload;
      const existing = shiftsByDate.get(p.date);
      if (existing) {
        existing.checkOutEventId = ev.id;
        existing.checkOutTime = p.timestamp;
        existing.originalCheckOutTime = p.timestamp;
        eventToShiftDate.set(ev.id, { date: p.date, kind: 'out' });
      }
    } else if (ev.type === 'EDIT') {
      const p = ev.payload as LedgerEditPayload;
      const ref = eventToShiftDate.get(p.targetEventId);
      if (ref) {
        const shift = shiftsByDate.get(ref.date);
        if (shift) {
          if (ref.kind === 'in') {
            shift.checkInTime = p.newValue;
          } else {
            shift.checkOutTime = p.newValue;
          }
          shift.edits.push({
            editEventId: ev.id,
            targetEventId: p.targetEventId,
            field: p.field,
            oldValue: p.oldValue,
            newValue: p.newValue,
            reason: p.reason,
            editorId: p.editorId,
            editorName: p.editorName,
            createdAt: ev.createdAt,
          });
        }
      }
    }
  }

  return Array.from(shiftsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
