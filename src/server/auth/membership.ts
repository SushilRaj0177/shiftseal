import type { NextFunction, Request, Response } from 'express';
import type { MemberRecord, MemberRole, WorkplaceRecord } from '../../shared/model.js';
import { getRepo } from '../data/index.js';
import { AppError } from '../middleware/errors.js';

export interface WorkplaceContext {
  workplace: WorkplaceRecord;
  member: MemberRecord;
}

declare module 'express-serve-static-core' {
  interface Request {
    ctx?: WorkplaceContext;
  }
}

const RANK: Record<MemberRole, number> = { worker: 0, supervisor: 1, owner: 2 };

export function atLeast(role: MemberRole, min: MemberRole): boolean {
  return RANK[role] >= RANK[min];
}

/**
 * Loads the workplace in `:wp` and the caller's active membership of it.
 * Anyone who is not a member gets the same 404 as a missing workplace.
 */
export async function loadMembership(req: Request, _res: Response, next: NextFunction) {
  try {
    const uid = req.identity?.uid;
    if (!uid) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in.');
    const wpId = String(req.params.wp ?? '');
    const repo = getRepo();
    const [workplace, member] = await Promise.all([
      repo.getWorkplace(wpId),
      repo.getMember(wpId, uid),
    ]);
    if (!workplace || !member || member.status !== 'active') {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }
    req.ctx = { workplace, member };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(min: MemberRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.ctx || !atLeast(req.ctx.member.role, min)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this.'));
      return;
    }
    next();
  };
}

export function ctx(req: Request): WorkplaceContext {
  if (!req.ctx) throw new AppError(500, 'NO_CONTEXT', 'Workplace context missing.');
  return req.ctx;
}
