import type {
  LedgerCheckInPayload,
  LedgerCheckProof,
  LedgerEditPayload,
  LedgerEvent,
  ShiftRecord,
} from '../../shared/types.js';
import type { CheckEvidence } from '../../shared/model.js';
import { latestView } from '../../shared/ledger/ledger.js';

export type CheckPayload = LedgerCheckInPayload & Partial<LedgerCheckProof>;

/** The shift that has a check-in but no check-out yet, if any. */
export function openShift(chain: LedgerEvent[]): ShiftRecord | undefined {
  return latestView(chain).find((s) => !s.checkOutEventId);
}

export function usedNonce(chain: LedgerEvent[], nonce: string): boolean {
  return chain.some((e) => e.type !== 'EDIT' && (e.payload as CheckPayload).nonce === nonce);
}

export function evidenceOf(event: LedgerEvent | undefined): CheckEvidence | undefined {
  if (!event || event.type === 'EDIT') return undefined;
  return (event.payload as CheckPayload).evidence;
}

export function editsOf(chain: LedgerEvent[]): (LedgerEvent & { payload: LedgerEditPayload })[] {
  return chain.filter((e) => e.type === 'EDIT') as (LedgerEvent & { payload: LedgerEditPayload })[];
}

/** Hours a worker was on site, per day, from their sealed (unedited) check-outs. */
export function sealedCheckoutTime(chain: LedgerEvent[], date: string): string | undefined {
  const out = chain.find(
    (e) => e.type === 'CHECK_OUT' && (e.payload as CheckPayload).date === date
  );
  return out ? (out.payload as CheckPayload).timestamp : undefined;
}
