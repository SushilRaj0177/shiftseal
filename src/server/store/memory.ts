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

export class MemoryStore implements Store {
  private snapshot: StoreSnapshot;

  constructor(initialSnapshot?: StoreSnapshot) {
    this.snapshot = initialSnapshot ? structuredClone(initialSnapshot) : buildSeedSnapshot();
  }

  async init(): Promise<void> {
    // Ready synchronously
  }

  async getWorkplaces(): Promise<Workplace[]> {
    return structuredClone(this.snapshot.workplaces);
  }

  async getWorkplace(id: string): Promise<Workplace | undefined> {
    const found = this.snapshot.workplaces.find((w) => w.id === id);
    return found ? structuredClone(found) : undefined;
  }

  async getWorkers(workplaceId?: string): Promise<WorkerProfile[]> {
    const list = workplaceId
      ? this.snapshot.workers.filter((w) => w.workplaceId === workplaceId)
      : this.snapshot.workers;
    return structuredClone(list);
  }

  async getWorker(id: string): Promise<WorkerProfile | undefined> {
    const found = this.snapshot.workers.find((w) => w.id === id);
    return found ? structuredClone(found) : undefined;
  }

  async getWorkerChain(workerId: string): Promise<LedgerEvent[]> {
    return structuredClone(this.snapshot.chains[workerId] ?? []);
  }

  async saveWorkerChain(workerId: string, chain: LedgerEvent[]): Promise<void> {
    this.snapshot.chains[workerId] = structuredClone(chain);
  }

  async getWorkerDeductions(workerId: string): Promise<DeductionItem[]> {
    return structuredClone(this.snapshot.deductions[workerId] ?? []);
  }

  async getClaims(workplaceId?: string): Promise<OvertimeClaim[]> {
    const list = workplaceId
      ? this.snapshot.claims.filter((c) => c.workplaceId === workplaceId)
      : this.snapshot.claims;
    return structuredClone(list).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getWorkerClaims(workerId: string): Promise<OvertimeClaim[]> {
    return structuredClone(this.snapshot.claims.filter((c) => c.workerId === workerId)).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
  }

  async saveClaim(claim: OvertimeClaim): Promise<void> {
    const idx = this.snapshot.claims.findIndex((c) => c.id === claim.id);
    if (idx >= 0) {
      this.snapshot.claims[idx] = structuredClone(claim);
    } else {
      this.snapshot.claims.push(structuredClone(claim));
    }
  }

  async getWorkerNotifications(workerId: string): Promise<WorkerNotification[]> {
    return structuredClone(this.snapshot.notifications.filter((n) => n.workerId === workerId)).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
  }

  async saveNotification(notification: WorkerNotification): Promise<void> {
    const idx = this.snapshot.notifications.findIndex((n) => n.id === notification.id);
    if (idx >= 0) {
      this.snapshot.notifications[idx] = structuredClone(notification);
    } else {
      this.snapshot.notifications.push(structuredClone(notification));
    }
  }

  async getHazards(workplaceId?: string): Promise<HazardReport[]> {
    const list = workplaceId
      ? this.snapshot.hazards.filter((h) => h.workplaceId === workplaceId)
      : this.snapshot.hazards;
    return structuredClone(list).sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
  }

  async saveHazard(hazard: HazardReport): Promise<void> {
    const idx = this.snapshot.hazards.findIndex((h) => h.id === hazard.id);
    if (idx >= 0) {
      this.snapshot.hazards[idx] = structuredClone(hazard);
    } else {
      this.snapshot.hazards.push(structuredClone(hazard));
    }
  }

  async getFeedback(workplaceId?: string): Promise<AnonymousFeedbackEntry[]> {
    const list = workplaceId
      ? this.snapshot.feedback.filter((f) => f.workplaceId === workplaceId)
      : this.snapshot.feedback;
    return structuredClone(list).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveFeedback(entry: AnonymousFeedbackEntry): Promise<void> {
    const idx = this.snapshot.feedback.findIndex((f) => f.id === entry.id);
    if (idx >= 0) {
      this.snapshot.feedback[idx] = structuredClone(entry);
    } else {
      this.snapshot.feedback.push(structuredClone(entry));
    }
  }

  async resetToSeed(snapshot: StoreSnapshot): Promise<void> {
    this.snapshot = structuredClone(snapshot);
  }
}
