import type { UserAccount } from '../../shared/model.js';
import type { ShiftRecord } from '../../shared/types.js';
import { latestView } from '../../shared/ledger/ledger.js';
import { getRepo } from '../data/index.js';

/**
 * Everything a person worked, at every workplace they belong to. A student
 * visa cap counts all jobs together, so one employer's records are not enough.
 */
export async function shiftsEverywhere(user: UserAccount | undefined, uid: string, here: string) {
  const repo = getRepo();
  const ids = new Set([here, ...(user?.memberships.map((m) => m.workplaceId) ?? [])]);
  const all: ShiftRecord[] = [];
  for (const id of ids) all.push(...latestView(await repo.getChain(id, uid)));
  return all;
}

export function studentProfileOf(user: UserAccount | undefined) {
  return { student: user?.student, breakUntil: user?.breakUntil, birthDate: user?.birthDate };
}
