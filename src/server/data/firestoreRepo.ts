import { Firestore } from '@google-cloud/firestore';
import type { LedgerEvent } from '../../shared/types.js';
import type {
  DailyDigest,
  InviteRecord,
  MemberRecord,
  UserAccount,
  WorkplaceRecord,
} from '../../shared/model.js';
import type { Collection, Identified, Repo } from './repo.js';

const seqId = (seq: number) => String(seq).padStart(9, '0');

/** Firestore storage. Errors propagate: a failed write is never reported as saved. */
export class FirestoreRepo implements Repo {
  private db = new Firestore({ ignoreUndefinedProperties: true });

  private wp(id: string) {
    return this.db.collection('workplaces').doc(id);
  }
  private member(workplaceId: string, uid: string) {
    return this.wp(workplaceId).collection('members').doc(uid);
  }

  async getUser(uid: string) {
    const s = await this.db.collection('users').doc(uid).get();
    return s.exists ? (s.data() as UserAccount) : undefined;
  }
  async saveUser(user: UserAccount) {
    await this.db.collection('users').doc(user.uid).set(user);
  }
  async deleteUser(uid: string) {
    await this.db.collection('users').doc(uid).delete();
  }

  async getWorkplace(id: string) {
    const s = await this.wp(id).get();
    return s.exists ? (s.data() as WorkplaceRecord) : undefined;
  }
  async saveWorkplace(wp: WorkplaceRecord) {
    await this.wp(wp.id).set(wp);
  }

  async getMember(workplaceId: string, uid: string) {
    const s = await this.member(workplaceId, uid).get();
    return s.exists ? (s.data() as MemberRecord) : undefined;
  }
  async listMembers(workplaceId: string) {
    const s = await this.wp(workplaceId).collection('members').get();
    return s.docs.map((d) => d.data() as MemberRecord);
  }
  async saveMember(member: MemberRecord) {
    await this.member(member.workplaceId, member.uid).set(member);
  }

  async getInvite(code: string) {
    const s = await this.db.collection('invites').doc(code).get();
    return s.exists ? (s.data() as InviteRecord) : undefined;
  }
  async saveInvite(invite: InviteRecord) {
    await this.db.collection('invites').doc(invite.code).set(invite);
  }

  async getChain(workplaceId: string, uid: string) {
    const s = await this.member(workplaceId, uid).collection('events').orderBy('seq').get();
    return s.docs.map((d) => (d.data() as { event: LedgerEvent }).event);
  }

  async appendToChain(
    workplaceId: string,
    uid: string,
    build: (chain: LedgerEvent[]) => LedgerEvent
  ) {
    const events = this.member(workplaceId, uid).collection('events');
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(events.orderBy('seq'));
      const chain = snap.docs.map((d) => (d.data() as { event: LedgerEvent }).event);
      const event = build(chain);
      const seq = chain.length;
      // create() fails if another writer already took this sequence number.
      tx.create(events.doc(seqId(seq)), { seq, event });
      return { event, seq };
    });
  }

  async list<T extends Identified>(workplaceId: string, collection: Collection) {
    const s = await this.wp(workplaceId).collection(collection).get();
    return s.docs.map((d) => d.data() as T);
  }
  async get<T extends Identified>(workplaceId: string, collection: Collection, id: string) {
    const s = await this.wp(workplaceId).collection(collection).doc(id).get();
    return s.exists ? (s.data() as T) : undefined;
  }
  async put<T extends Identified>(workplaceId: string, collection: Collection, item: T) {
    await this.wp(workplaceId).collection(collection).doc(item.id).set(item);
  }

  async getDigest(workplaceId: string, date: string) {
    const s = await this.wp(workplaceId).collection('digests').doc(date).get();
    return s.exists ? (s.data() as DailyDigest) : undefined;
  }
  async sealDigest(digest: DailyDigest) {
    const ref = this.wp(digest.workplaceId).collection('digests').doc(digest.date);
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (s.exists) return s.data() as DailyDigest;
      tx.create(ref, digest);
      return digest;
    });
  }
}
