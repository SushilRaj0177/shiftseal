import { randomBytes, randomInt } from 'node:crypto';

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('base64url')}`;
}

// No 0/O, 1/I/L: invite codes are read aloud and typed on phones.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** An invite code like `TWR-4K9P`, prefixed with letters from the workplace name. */
export function newInviteCode(workplaceName: string): string {
  const prefix = workplaceName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/[OIL]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
  let tail = '';
  for (let i = 0; i < 5; i++) tail += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${prefix}-${tail}`;
}
