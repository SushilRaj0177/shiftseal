import type { LedgerEvent } from '../../shared/types.js';
import type {
  DailyDigest,
  InviteRecord,
  MemberRecord,
  UserAccount,
  WorkplaceRecord,
} from '../../shared/model.js';
import type { Collection, Identified, Repo } from './repo.js';

const clone = <T>(v: T): T => structuredClone(v);

/** In-memory storage for local development and tests. */
export class MemoryRepo implements Repo {
  private users = new Map<string, UserAccount>();
  private workplaces = new Map<string, WorkplaceRecord>();
  private members = new Map<string, MemberRecord>();
  private invites = new Map<string, InviteRecord>();
  private chains = new Map<string, LedgerEvent[]>();
  private collections = new Map<string, Map<string, Identified>>();
  private digests = new Map<string, DailyDigest>();

  async getUser(uid: string) {
    const u = this.users.get(uid);
    return u && clone(u);
  }
  async saveUser(user: UserAccount) {
    this.users.set(user.uid, clone(user));
  }
  async deleteUser(uid: string) {
    this.users.delete(uid);
  }

  async getWorkplace(id: string) {
    const w = this.workplaces.get(id);
    return w && clone(w);
  }
  async saveWorkplace(wp: WorkplaceRecord) {
    this.workplaces.set(wp.id, clone(wp));
  }

  async getMember(workplaceId: string, uid: string) {
    const m = this.members.get(`${workplaceId}/${uid}`);
    return m && clone(m);
  }
  async listMembers(workplaceId: string) {
    return [...this.members.values()].filter((m) => m.workplaceId === workplaceId).map(clone);
  }
  async saveMember(member: MemberRecord) {
    this.members.set(`${member.workplaceId}/${member.uid}`, clone(member));
  }

  async getInvite(code: string) {
    const i = this.invites.get(code);
    return i && clone(i);
  }
  async saveInvite(invite: InviteRecord) {
    this.invites.set(invite.code, clone(invite));
  }

  async getChain(workplaceId: string, uid: string) {
    return clone(this.chains.get(`${workplaceId}/${uid}`) ?? []);
  }
  async appendToChain(
    workplaceId: string,
    uid: string,
    build: (chain: LedgerEvent[]) => LedgerEvent
  ) {
    const key = `${workplaceId}/${uid}`;
    const chain = this.chains.get(key) ?? [];
    const event = build(clone(chain));
    this.chains.set(key, [...chain, clone(event)]);
    return { event: clone(event), seq: chain.length };
  }

  private coll(workplaceId: string, collection: Collection) {
    const key = `${workplaceId}/${collection}`;
    let c = this.collections.get(key);
    if (!c) {
      c = new Map();
      this.collections.set(key, c);
    }
    return c;
  }
  async list<T extends Identified>(workplaceId: string, collection: Collection) {
    return [...this.coll(workplaceId, collection).values()].map((v) => clone(v) as T);
  }
  async get<T extends Identified>(workplaceId: string, collection: Collection, id: string) {
    const v = this.coll(workplaceId, collection).get(id);
    return v && (clone(v) as T);
  }
  async put<T extends Identified>(workplaceId: string, collection: Collection, item: T) {
    this.coll(workplaceId, collection).set(item.id, clone(item));
  }

  async getDigest(workplaceId: string, date: string) {
    const d = this.digests.get(`${workplaceId}/${date}`);
    return d && clone(d);
  }
  async sealDigest(digest: DailyDigest) {
    const key = `${digest.workplaceId}/${digest.date}`;
    if (!this.digests.has(key)) this.digests.set(key, clone(digest));
    return clone(this.digests.get(key)!);
  }
}
