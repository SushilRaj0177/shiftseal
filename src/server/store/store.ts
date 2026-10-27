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

export interface StoreSnapshot {
  workplaces: Workplace[];
  workers: WorkerProfile[];
  chains: Record<string, LedgerEvent[]>;
  deductions: Record<string, DeductionItem[]>;
  claims: OvertimeClaim[];
  notifications: WorkerNotification[];
  hazards: HazardReport[];
  feedback: AnonymousFeedbackEntry[];
}

export interface Store {
  init(): Promise<void>;
  getWorkplaces(): Promise<Workplace[]>;
  getWorkplace(id: string): Promise<Workplace | undefined>;
  getWorkers(workplaceId?: string): Promise<WorkerProfile[]>;
  getWorker(id: string): Promise<WorkerProfile | undefined>;
  getWorkerChain(workerId: string): Promise<LedgerEvent[]>;
  saveWorkerChain(workerId: string, chain: LedgerEvent[]): Promise<void>;
  getWorkerDeductions(workerId: string): Promise<DeductionItem[]>;
  getClaims(workplaceId?: string): Promise<OvertimeClaim[]>;
  getWorkerClaims(workerId: string): Promise<OvertimeClaim[]>;
  saveClaim(claim: OvertimeClaim): Promise<void>;
  getWorkerNotifications(workerId: string): Promise<WorkerNotification[]>;
  saveNotification(notification: WorkerNotification): Promise<void>;
  getHazards(workplaceId?: string): Promise<HazardReport[]>;
  saveHazard(hazard: HazardReport): Promise<void>;
  getFeedback(workplaceId?: string): Promise<AnonymousFeedbackEntry[]>;
  saveFeedback(entry: AnonymousFeedbackEntry): Promise<void>;
  resetToSeed(snapshot: StoreSnapshot): Promise<void>;
}
