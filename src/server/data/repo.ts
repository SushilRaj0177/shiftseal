import type { LedgerEvent } from '../../shared/types.js';
import type {
  DailyDigest,
  InviteRecord,
  MemberRecord,
  UserAccount,
  WorkplaceRecord,
} from '../../shared/model.js';

/** Per-workplace collections of independent records. */
export type Collection =
  | 'claims'
  | 'hazards'
  | 'feedback'
  | 'notifications'
  | 'flags'
  | 'payments'
  | 'deductions'
  | 'receipts'
  | 'photos'
  | 'leave'
  | 'complaints';

export interface Identified {
  id: string;
}

/**
 * Storage for the production app. Layout (Firestore):
 *
 *   users/{uid}
 *   invites/{code}
 *   workplaces/{wp}
 *   workplaces/{wp}/members/{uid}
 *   workplaces/{wp}/members/{uid}/events/{seq}   the worker's hash chain
 *   workplaces/{wp}/{collection}/{id}
 *   workplaces/{wp}/digests/{date}
 */
export interface Repo {
  getUser(uid: string): Promise<UserAccount | undefined>;
  saveUser(user: UserAccount): Promise<void>;
  deleteUser(uid: string): Promise<void>;

  getWorkplace(id: string): Promise<WorkplaceRecord | undefined>;
  saveWorkplace(wp: WorkplaceRecord): Promise<void>;

  getMember(workplaceId: string, uid: string): Promise<MemberRecord | undefined>;
  listMembers(workplaceId: string): Promise<MemberRecord[]>;
  saveMember(member: MemberRecord): Promise<void>;

  getInvite(code: string): Promise<InviteRecord | undefined>;
  saveInvite(invite: InviteRecord): Promise<void>;

  getChain(workplaceId: string, uid: string): Promise<LedgerEvent[]>;
  /**
   * Appends one event atomically. `build` receives the current chain and
   * returns the complete next event (including its hash); concurrent appends
   * are serialised, so the chain can never fork.
   */
  appendToChain(
    workplaceId: string,
    uid: string,
    build: (chain: LedgerEvent[]) => LedgerEvent
  ): Promise<{ event: LedgerEvent; seq: number }>;

  list<T extends Identified>(workplaceId: string, collection: Collection): Promise<T[]>;
  get<T extends Identified>(
    workplaceId: string,
    collection: Collection,
    id: string
  ): Promise<T | undefined>;
  put<T extends Identified>(workplaceId: string, collection: Collection, item: T): Promise<void>;

  getDigest(workplaceId: string, date: string): Promise<DailyDigest | undefined>;
  /** Saves the digest unless one already exists for that date; returns the stored one. */
  sealDigest(digest: DailyDigest): Promise<DailyDigest>;
}
