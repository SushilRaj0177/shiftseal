import { Firestore } from '@google-cloud/firestore';
import type {
  Workplace,
  WorkerProfile,
  LedgerEvent,
  OvertimeClaim,
  WorkerNotification,
  HazardReport,
  AnonymousFeedbackEntry,
  DeductionItem,
} from '../../shared/types.js';
import type { Store, StoreSnapshot } from './store.js';
import { buildSeedSnapshot } from './seed.js';
import { MemoryStore } from './memory.js';

const COLLECTION = 'shiftseal_state';
const DOC_ID = 'main_snapshot_v1';

export class FirestoreStore implements Store {
  private db: Firestore;
  private cache: MemoryStore;
  private initialized = false;

  constructor() {
    this.db = new Firestore({
      ignoreUndefinedProperties: true,
    });
    this.cache = new MemoryStore(buildSeedSnapshot());
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const docRef = this.db.collection(COLLECTION).doc(DOC_ID);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data() as StoreSnapshot | undefined;
        if (data && Array.isArray(data.workplaces) && data.workplaces.length > 0) {
          await this.cache.resetToSeed(data);
          this.initialized = true;
          return;
        }
      }
      // Seed Firestore on first boot
      const initial = buildSeedSnapshot();
      await docRef.set(initial);
      await this.cache.resetToSeed(initial);
      this.initialized = true;
    } catch (err) {
      console.warn(
        '[FirestoreStore] Falling back to in-memory seed cache cleanly:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      this.initialized = true;
    }
  }

  private async syncState(updater: (snap: StoreSnapshot) => void): Promise<void> {
    await this.init();
    try {
      const docRef = this.db.collection(COLLECTION).doc(DOC_ID);
      const snap = await docRef.get();
      const current: StoreSnapshot = snap.exists
        ? (snap.data() as StoreSnapshot)
        : buildSeedSnapshot();
      updater(current);
      await docRef.set(current);
      await this.cache.resetToSeed(current);
    } catch {
      // Keep local cache operational even if Firestore write fails transiently
    }
  }

  private async refreshFromRemote(): Promise<void> {
    try {
      const docRef = this.db.collection(COLLECTION).doc(DOC_ID);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data() as StoreSnapshot;
        if (data && Array.isArray(data.workplaces)) {
          await this.cache.resetToSeed(data);
        }
      }
    } catch {
      // Use cached state
    }
  }

  async getWorkplaces(): Promise<Workplace[]> {
    await this.init();
    return this.cache.getWorkplaces();
  }

  async getWorkplace(id: string): Promise<Workplace | undefined> {
    await this.init();
    return this.cache.getWorkplace(id);
  }

  async getWorkers(workplaceId?: string): Promise<WorkerProfile[]> {
    await this.init();
    return this.cache.getWorkers(workplaceId);
  }

  async getWorker(id: string): Promise<WorkerProfile | undefined> {
    await this.init();
    return this.cache.getWorker(id);
  }

  async getWorkerChain(workerId: string): Promise<LedgerEvent[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getWorkerChain(workerId);
  }

  async saveWorkerChain(workerId: string, chain: LedgerEvent[]): Promise<void> {
    await this.cache.saveWorkerChain(workerId, chain);
    await this.syncState((s) => {
      s.chains[workerId] = chain;
    });
  }

  async getWorkerDeductions(workerId: string): Promise<DeductionItem[]> {
    await this.init();
    return this.cache.getWorkerDeductions(workerId);
  }

  async getClaims(workplaceId?: string): Promise<OvertimeClaim[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getClaims(workplaceId);
  }

  async getWorkerClaims(workerId: string): Promise<OvertimeClaim[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getWorkerClaims(workerId);
  }

  async saveClaim(claim: OvertimeClaim): Promise<void> {
    await this.cache.saveClaim(claim);
    await this.syncState((s) => {
      const idx = s.claims.findIndex((c) => c.id === claim.id);
      if (idx >= 0) s.claims[idx] = claim;
      else s.claims.push(claim);
    });
  }

  async getWorkerNotifications(workerId: string): Promise<WorkerNotification[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getWorkerNotifications(workerId);
  }

  async saveNotification(notification: WorkerNotification): Promise<void> {
    await this.cache.saveNotification(notification);
    await this.syncState((s) => {
      const idx = s.notifications.findIndex((n) => n.id === notification.id);
      if (idx >= 0) s.notifications[idx] = notification;
      else s.notifications.push(notification);
    });
  }

  async getHazards(workplaceId?: string): Promise<HazardReport[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getHazards(workplaceId);
  }

  async saveHazard(hazard: HazardReport): Promise<void> {
    await this.cache.saveHazard(hazard);
    await this.syncState((s) => {
      const idx = s.hazards.findIndex((h) => h.id === hazard.id);
      if (idx >= 0) s.hazards[idx] = hazard;
      else s.hazards.push(hazard);
    });
  }

  async getFeedback(workplaceId?: string): Promise<AnonymousFeedbackEntry[]> {
    await this.init();
    await this.refreshFromRemote();
    return this.cache.getFeedback(workplaceId);
  }

  async saveFeedback(entry: AnonymousFeedbackEntry): Promise<void> {
    await this.cache.saveFeedback(entry);
    await this.syncState((s) => {
      const idx = s.feedback.findIndex((f) => f.id === entry.id);
      if (idx >= 0) s.feedback[idx] = entry;
      else s.feedback.push(entry);
    });
  }

  async resetToSeed(snapshot: StoreSnapshot): Promise<void> {
    await this.cache.resetToSeed(snapshot);
    await this.syncState((s) => {
      Object.assign(s, snapshot);
    });
  }
}

let activeStore: Store | null = null;

export function getStore(): Store {
  if (!activeStore) {
    activeStore = process.env.STORE === 'firestore' ? new FirestoreStore() : new MemoryStore();
  }
  return activeStore;
}

export function setStoreForTests(store: Store): void {
  activeStore = store;
}
