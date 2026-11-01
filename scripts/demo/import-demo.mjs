// Loads the demo workplace (scripts/demo/snapshot.json) into Firestore.
//
// Run once from Cloud Shell, after `npm ci && npm run build`:
//   GOOGLE_CLOUD_PROJECT=promptwars-512900 node scripts/demo/import-demo.mjs
//
// The snapshot is a week at a fictional site with signed shifts, made by the
// local seed. Records are copied exactly, so every chain and signature still
// verifies. The invite code is replaced with a fresh one that is not published.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../../dist/server/server');
const { FirestoreRepo } = await import(`${dist}/data/firestoreRepo.js`);
const { newInviteCode } = await import(`${dist}/services/ids.js`);

const snap = JSON.parse(readFileSync(path.join(here, 'snapshot.json'), 'utf8'));
const repo = new FirestoreRepo();
const [[wpId, workplace]] = snap.workplaces;

if (await repo.getWorkplace(wpId)) {
  console.log(`The demo workplace ${wpId} is already there. Nothing to do.`);
  process.exit(0);
}

const code = newInviteCode(workplace.name);
for (const [, user] of snap.users) await repo.saveUser(user);
for (const [, member] of snap.members) await repo.saveMember(member);
for (const [key, events] of snap.chains) {
  const uid = key.slice(key.indexOf('/') + 1);
  for (const event of events) await repo.appendToChain(wpId, uid, () => event);
}
for (const [key, items] of snap.collections) {
  const collection = key.slice(key.indexOf('/') + 1);
  for (const item of items) await repo.put(wpId, collection, item);
}
for (const [, digest] of snap.digests) await repo.sealDigest(digest);
await repo.saveInvite({
  code,
  workplaceId: wpId,
  role: 'worker',
  createdBy: workplace.ownerUid ?? snap.users[0][0],
  createdAt: new Date().toISOString(),
});
// The workplace last, so a half-finished run is retried rather than skipped.
await repo.saveWorkplace({ ...workplace, inviteCode: code });
console.log(`Demo workplace ${wpId} loaded: ${snap.users.length} accounts.`);
