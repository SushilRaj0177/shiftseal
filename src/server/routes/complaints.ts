import { Router } from 'express';
import type { Complaint, MemberRecord } from '../../shared/model.js';
import {
  complaintMessageSchema,
  complaintStatusSchema,
  fileComplaintSchema,
} from '../../shared/apiSchemas.js';
import { countryPack } from '../../shared/countries/index.js';
import { ctx } from '../auth/membership.js';
import { getRepo } from '../data/index.js';
import { AppError } from '../middleware/errors.js';
import { newId } from '../services/ids.js';

/**
 * Confidential harassment complaints to the people the workplace has named to
 * receive them, under the workplace's country's law (India: the Internal
 * Committee under the POSH Act; Japan: 相談窓口; and so on).
 *
 * Access is decided here and nowhere else: a complaint is visible to the
 * person who filed it and to committee members they did not exclude. Owners
 * and supervisors who are not on the committee get counts only, through the
 * dashboard. Complaint text is never sent to the AI and never logged.
 */
export const complaintsRouter = Router({ mergeParams: true });

function canRead(c: Complaint, m: MemberRecord): boolean {
  return (
    c.complainantUid === m.uid || (Boolean(m.icMember) && !c.excludedCommitteeUids.includes(m.uid))
  );
}

function asCommittee(c: Complaint, m: MemberRecord): boolean {
  return (
    Boolean(m.icMember) && c.complainantUid !== m.uid && !c.excludedCommitteeUids.includes(m.uid)
  );
}

/** Who is on the committee. The law requires this to be known to everyone. */
complaintsRouter.get('/committee', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const members = (await getRepo().listMembers(workplace.id)).filter(
      (m) => m.status === 'active'
    );
    const committee = members.filter((m) => m.icMember);
    const rules = countryPack(workplace).complaints;
    res.json({
      committee: committee.map((m) => ({
        uid: m.uid,
        name: m.name,
        presiding: Boolean(m.icPresiding),
      })),
      required: members.length >= rules.handlersRequiredFrom,
      isMember: Boolean(member.icMember),
      presiding: rules.presiding,
      complaintWindowDays: rules.outsideLimitDays ?? null,
      inquiryDays: rules.inquiryDays ?? null,
      external: rules.external,
    });
  } catch (err) {
    next(err);
  }
});

complaintsRouter.get('/complaints', async (req, res, next) => {
  try {
    const { workplace, member } = ctx(req);
    const all = await getRepo().list<Complaint>(workplace.id, 'complaints');
    const visible = all
      .filter((c) => canRead(c, member))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json({
      mine: visible.filter((c) => c.complainantUid === member.uid),
      committee: visible.filter((c) => asCommittee(c, member)),
    });
  } catch (err) {
    next(err);
  }
});

complaintsRouter.post('/complaints', async (req, res, next) => {
  try {
    const body = fileComplaintSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const members = await getRepo().listMembers(workplace.id);
    const committee = new Set(members.filter((m) => m.icMember).map((m) => m.uid));
    if (body.excludedCommitteeUids.some((uid) => !committee.has(uid))) {
      throw new AppError(400, 'NOT_COMMITTEE', 'You can only exclude members of the committee.');
    }
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: newId('cmp'),
      workplaceId: workplace.id,
      complainantUid: member.uid,
      complainantName: member.name,
      respondentName: body.respondentName,
      incidentDate: body.incidentDate,
      place: body.place,
      description: body.description,
      witnesses: body.witnesses,
      excludedCommitteeUids: body.excludedCommitteeUids,
      status: 'received',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    await getRepo().put(workplace.id, 'complaints', complaint);
    res.status(201).json({ complaint });
  } catch (err) {
    next(err);
  }
});

complaintsRouter.post('/complaints/message', async (req, res, next) => {
  try {
    const body = complaintMessageSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const c = await repo.get<Complaint>(workplace.id, 'complaints', body.complaintId);
    if (!c || !canRead(c, member)) throw new AppError(404, 'NOT_FOUND', 'Complaint not found.');
    const now = new Date().toISOString();
    const updated: Complaint = {
      ...c,
      updatedAt: now,
      messages: [
        ...c.messages,
        {
          id: newId('msg'),
          fromRole: c.complainantUid === member.uid ? 'complainant' : 'committee',
          fromName: c.complainantUid === member.uid ? member.name : `${member.name} (committee)`,
          text: body.text,
          at: now,
        },
      ],
    };
    await repo.put(workplace.id, 'complaints', updated);
    res.json({ complaint: updated });
  } catch (err) {
    next(err);
  }
});

complaintsRouter.post('/complaints/status', async (req, res, next) => {
  try {
    const body = complaintStatusSchema.parse(req.body);
    const { workplace, member } = ctx(req);
    const repo = getRepo();
    const c = await repo.get<Complaint>(workplace.id, 'complaints', body.complaintId);
    if (!c || !canRead(c, member)) throw new AppError(404, 'NOT_FOUND', 'Complaint not found.');
    if (!asCommittee(c, member))
      throw new AppError(403, 'FORBIDDEN', 'Only the committee can change the status.');
    const now = new Date().toISOString();
    const updated: Complaint = {
      ...c,
      status: body.status,
      updatedAt: now,
      messages: body.note
        ? [
            ...c.messages,
            {
              id: newId('msg'),
              fromRole: 'committee',
              fromName: `${member.name} (committee)`,
              text: body.note,
              at: now,
            },
          ]
        : c.messages,
    };
    await repo.put(workplace.id, 'complaints', updated);
    res.json({ complaint: updated });
  } catch (err) {
    next(err);
  }
});

/** Counts only, for the owner's dashboard and compliance flags. */
export function complaintCounts(all: Complaint[], inquiryDays?: number) {
  const cutoff = inquiryDays ? Date.now() - inquiryDays * 86_400_000 : -Infinity;
  const open = all.filter((c) => c.status === 'received' || c.status === 'inquiry');
  return {
    open: open.length,
    overdue: open.filter((c) => Date.parse(c.createdAt) < cutoff).length,
  };
}
