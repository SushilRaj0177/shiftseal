import type { FlagRecord } from '../../shared/model.js';
import type { FlagDraft } from '../../shared/rules/flags.js';
import { getRepo } from '../data/index.js';
import { newId } from './ids.js';

export async function raiseFlags(workplaceId: string, drafts: FlagDraft[]): Promise<FlagRecord[]> {
  const repo = getRepo();
  const now = new Date().toISOString();
  const records: FlagRecord[] = drafts.map((d) => ({
    ...d,
    id: newId('flg'),
    workplaceId,
    createdAt: now,
    status: 'open',
  }));
  await Promise.all(records.map((r) => repo.put(workplaceId, 'flags', r)));
  return records;
}

/**
 * What a person may see. Workers see every flag about their own records,
 * including ones that question them, so nothing is decided behind their back.
 */
export function visibleFlags(flags: FlagRecord[], uid: string, isStaff: boolean): FlagRecord[] {
  return isStaff ? flags : flags.filter((f) => f.subject.workerUid === uid);
}
