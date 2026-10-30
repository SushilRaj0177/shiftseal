import { getConfig } from '../config.js';
import { FirestoreRepo } from './firestoreRepo.js';
import { MemoryRepo } from './memoryRepo.js';
import type { Repo } from './repo.js';

let repo: Repo | null = null;

export function getRepo(): Repo {
  if (!repo) repo = getConfig().STORE === 'firestore' ? new FirestoreRepo() : new MemoryRepo();
  return repo;
}

/** Tests only: start from empty storage. */
export function resetRepo(next: Repo = new MemoryRepo()): void {
  repo = next;
}

export type { Repo, Collection } from './repo.js';
