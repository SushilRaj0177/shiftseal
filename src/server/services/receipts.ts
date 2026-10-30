import type { LedgerEvent } from '../../shared/types.js';
import type { DailyDigest, ServerReceipt, WorkplaceRecord } from '../../shared/model.js';
import { sha256Hex } from '../../shared/ledger/ledger.js';
import { localParts } from '../../shared/time.js';
import { getRepo } from '../data/index.js';
import { signReceipt } from '../keys.js';

/** Signs proof that an event was accepted, so the worker can show it later. */
export async function issueReceipt(
  workplaceId: string,
  workerUid: string,
  event: LedgerEvent,
  seq: number
): Promise<ServerReceipt> {
  const body = {
    workplaceId,
    workerUid,
    eventId: event.id,
    seq,
    hash: event.hash,
    at: event.createdAt,
  };
  const receipt: ServerReceipt = { ...body, sig: signReceipt(body) };
  await getRepo().put(workplaceId, 'receipts', { id: event.id, ...receipt });
  return receipt;
}

function eventLocalDate(ev: LedgerEvent, timezone: string): string {
  return localParts(new Date(ev.createdAt), timezone).date;
}

/**
 * The fingerprint of every worker's record as it stood at the end of `date`.
 * It is sealed once, after the day has ended, and never recomputed; a later
 * rewrite of anyone's history would no longer match it.
 */
export async function sealDigest(wp: WorkplaceRecord, date: string): Promise<DailyDigest | null> {
  const repo = getRepo();
  const existing = await repo.getDigest(wp.id, date);
  if (existing) return existing;

  const today = localParts(new Date(), wp.timezone).date;
  if (date >= today) return null; // the day is not over yet

  const members = await repo.listMembers(wp.id);
  const leaves: DailyDigest['leaves'] = [];
  for (const m of members.sort((a, b) => a.uid.localeCompare(b.uid))) {
    const chain = await repo.getChain(wp.id, m.uid);
    let last = -1;
    chain.forEach((ev, i) => {
      if (eventLocalDate(ev, wp.timezone) <= date) last = i;
    });
    if (last >= 0) leaves.push({ uid: m.uid, seq: last, hash: chain[last].hash });
  }
  const root = sha256Hex(leaves.map((l) => `${l.uid}:${l.seq}:${l.hash}`).join('\n'));
  const body = { workplaceId: wp.id, date, leaves, root, sealedAt: new Date().toISOString() };
  return repo.sealDigest({ ...body, sig: signReceipt(body) });
}
