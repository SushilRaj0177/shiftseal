import { Router } from 'express';
import { defaultLabels } from '../services/labels.js';
import {
  COUNTRIES,
  countryPack,
  type CountryId,
  type PayCycle,
} from '../../shared/countries/index.js';
import type { MemberRecord, UserAccount, WorkplaceRecord } from '../../shared/model.js';
import {
  acceptInviteSchema,
  createWorkplaceSchema,
  inviteCodeSchema,
  updateProfileSchema,
} from '../../shared/apiSchemas.js';
import { requireIdentity, type Identity } from '../auth/identity.js';
import { getConfig } from '../config.js';
import { getRepo } from '../data/index.js';
import { receiptPublicJwk } from '../keys.js';
import { AppError } from '../middleware/errors.js';
import { newId, newInviteCode } from '../services/ids.js';

export const publicRouter = Router();

/** Public settings the web app needs before sign-in. */
publicRouter.get('/config', (_req, res) => {
  const c = getConfig();
  res.json({
    authMode: c.AUTH_MODE,
    firebase: {
      apiKey: c.FIREBASE_WEB_API_KEY ?? null,
      authDomain: c.FIREBASE_AUTH_DOMAIN ?? null,
      projectId: c.FIREBASE_PROJECT_ID ?? c.GOOGLE_CLOUD_PROJECT ?? null,
    },
  });
});

/** The key that signs receipts and daily fingerprints, for independent verification. */
publicRouter.get('/receipts/key', (_req, res) => {
  res.json({ alg: 'EdDSA', key: receiptPublicJwk() });
});

export const accountRouter = Router();
accountRouter.use(requireIdentity);

async function ensureUser(identity: Identity): Promise<UserAccount> {
  const repo = getRepo();
  const existing = await repo.getUser(identity.uid);
  if (existing) return existing;
  const user: UserAccount = {
    uid: identity.uid,
    phone: identity.phone,
    email: identity.email,
    name: identity.name ?? '',
    language: 'en-IN',
    createdAt: new Date().toISOString(),
    memberships: [],
  };
  await repo.saveUser(user);
  return user;
}

accountRouter.get('/me', async (req, res, next) => {
  try {
    const repo = getRepo();
    const user = await ensureUser(req.identity!);
    const workplaces = await Promise.all(
      user.memberships.map(async (m) => {
        const [wp, member] = await Promise.all([
          repo.getWorkplace(m.workplaceId),
          repo.getMember(m.workplaceId, user.uid),
        ]);
        if (!wp || !member || member.status !== 'active') return null;
        return { id: wp.id, name: wp.name, sector: wp.sector, role: member.role };
      })
    );
    res.json({ user, workplaces: workplaces.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

accountRouter.patch('/me', async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const user = await ensureUser(req.identity!);
    // null clears a field (a student who has finished their studies).
    const fields = { ...(user as unknown as Record<string, unknown>) };
    for (const [k, v] of Object.entries(body)) {
      if (v === null) delete fields[k];
      else if (v !== undefined) fields[k] = v;
    }
    const updated = fields as unknown as typeof user;
    await getRepo().saveUser(updated);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes the signed-in person's account. Their profile (name, phone, email,
 * birth date, student status) is erased and they leave every workplace. Sealed
 * shift records stay with the employer under "Former member", because wage
 * records must be kept by law and the hash chain cannot be edited. An owner
 * whose workplace still has people in it cannot delete from the app: those
 * people's records depend on the workplace, so it is closed with them by
 * request instead (see /privacy.html).
 */
accountRouter.delete('/me', async (req, res, next) => {
  try {
    const repo = getRepo();
    const uid = req.identity!.uid;
    const user = await repo.getUser(uid);
    if (user) {
      for (const m of user.memberships) {
        if (m.role !== 'owner') continue;
        const others = (await repo.listMembers(m.workplaceId)).filter(
          (x) => x.uid !== uid && x.status === 'active'
        );
        if (others.length > 0) {
          throw new AppError(
            409,
            'OWNER_HAS_PEOPLE',
            'A workplace you own still has people in it, and their records depend on it. Request deletion from the privacy page and we will close the workplace with you.'
          );
        }
      }
      for (const m of user.memberships) {
        const member = await repo.getMember(m.workplaceId, uid);
        if (!member) continue;
        const kept = { ...member, name: 'Former member', status: 'removed' as const };
        delete kept.phone;
        delete kept.device;
        delete kept.pendingDevice;
        delete kept.icMember;
        delete kept.icPresiding;
        await repo.saveMember(kept);
      }
      await repo.deleteUser(uid);
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

/** Settings must fit the country: its pay cycles, its regions, a real time zone. */
export function checkCountrySettings(body: {
  country?: CountryId;
  region?: string;
  payCycle?: string;
  timezone?: string;
}) {
  const base = COUNTRIES[body.country ?? 'IN'];
  if (body.region && !base.regions?.some((r) => r.id === body.region)) {
    throw new AppError(400, 'BAD_REGION', 'That state or region is not known for this country.');
  }
  const pack = countryPack({ country: body.country, region: body.region });
  if (body.payCycle && !pack.pay.cycles.includes(body.payCycle as PayCycle)) {
    throw new AppError(400, 'BAD_PAY_CYCLE', 'That pay cycle is not used in this country.');
  }
  if (body.timezone) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: body.timezone });
    } catch {
      throw new AppError(400, 'BAD_TIMEZONE', 'Unknown time zone.');
    }
  }
}

accountRouter.post('/workplaces', async (req, res, next) => {
  try {
    const body = createWorkplaceSchema.parse(req.body);
    const repo = getRepo();
    const user = await ensureUser(req.identity!);
    const codes = new Set(body.zones.map((z) => z.code));
    if (codes.size !== body.zones.length) {
      throw new AppError(400, 'DUPLICATE_ZONE', 'Each zone needs its own code.');
    }

    const now = new Date().toISOString();
    const { ownerName, ...settings } = body;
    const pack = countryPack({ country: body.country, region: body.region });
    checkCountrySettings(body);
    const wp: WorkplaceRecord = {
      ...settings,
      timezone: body.timezone ?? pack.timezone,
      payCycle: body.payCycle ?? pack.pay.defaultCycle[body.sector],
      weeklyOff: body.weeklyOff ?? pack.weeklyOff,
      id: newId('wp'),
      ownerUid: user.uid,
      inviteCode: newInviteCode(body.name),
      createdAt: now,
    };
    const owner: MemberRecord = {
      uid: user.uid,
      workplaceId: wp.id,
      role: 'owner',
      name: ownerName,
      phone: user.phone,
      title: defaultLabels(wp.country).owner,
      team: defaultLabels(wp.country).management,
      hourlyRate: 0,
      dailyWage: 0,
      language: user.language,
      joinedAt: now,
      status: 'active',
    };
    await repo.saveWorkplace(wp);
    await repo.saveMember(owner);
    await repo.saveInvite({
      code: wp.inviteCode,
      workplaceId: wp.id,
      role: 'worker',
      createdBy: user.uid,
      createdAt: now,
    });
    await repo.saveUser({
      ...user,
      name: user.name || ownerName,
      memberships: [...user.memberships, { workplaceId: wp.id, role: 'owner' }],
    });
    res.status(201).json({ workplace: wp });
  } catch (err) {
    next(err);
  }
});

async function usableInvite(code: string, identity: Identity) {
  const repo = getRepo();
  const invite = await repo.getInvite(code.toUpperCase());
  if (!invite || invite.revoked) {
    throw new AppError(
      404,
      'INVITE_NOT_FOUND',
      'That code was not found. Check it with your supervisor.'
    );
  }
  if (invite.phone && invite.phone !== identity.phone) {
    throw new AppError(
      403,
      'INVITE_PHONE_MISMATCH',
      'This invite was sent to a different phone number.'
    );
  }
  const wp = await repo.getWorkplace(invite.workplaceId);
  if (!wp) throw new AppError(404, 'INVITE_NOT_FOUND', 'That workplace no longer exists.');
  return { invite, wp };
}

accountRouter.post('/invites/preview', async (req, res, next) => {
  try {
    const { code } = inviteCodeSchema.parse(req.body);
    const { invite, wp } = await usableInvite(code, req.identity!);
    const inviter = await getRepo().getMember(wp.id, invite.createdBy);
    res.json({
      workplace: { id: wp.id, name: wp.name, sector: wp.sector },
      role: invite.role,
      invitedBy: inviter?.name ?? null,
    });
  } catch (err) {
    next(err);
  }
});

accountRouter.post('/invites/accept', async (req, res, next) => {
  try {
    const body = acceptInviteSchema.parse(req.body);
    const repo = getRepo();
    const { invite, wp } = await usableInvite(body.code, req.identity!);
    const user = await ensureUser(req.identity!);
    const existing = await repo.getMember(wp.id, user.uid);
    if (existing?.status === 'active') {
      res.json({ workplace: { id: wp.id, name: wp.name }, member: existing });
      return;
    }
    const member: MemberRecord = {
      uid: user.uid,
      workplaceId: wp.id,
      role: invite.role,
      name: body.name,
      phone: req.identity!.phone,
      title: defaultLabels(wp.country)[invite.role === 'supervisor' ? 'supervisor' : 'worker'],
      team: defaultLabels(wp.country).general,
      hourlyRate: 0,
      dailyWage: 0,
      language: body.language,
      joinedAt: new Date().toISOString(),
      status: 'active',
    };
    await repo.saveMember(member);
    // A personal (phone-bound) invite is single use.
    if (invite.phone) await repo.saveInvite({ ...invite, revoked: true });
    await repo.saveUser({
      ...user,
      name: user.name || body.name,
      language: body.language,
      memberships: [
        ...user.memberships.filter((m) => m.workplaceId !== wp.id),
        { workplaceId: wp.id, role: invite.role },
      ],
    });
    res.status(201).json({ workplace: { id: wp.id, name: wp.name }, member });
  } catch (err) {
    next(err);
  }
});
