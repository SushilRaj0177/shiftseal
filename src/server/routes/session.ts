import { Router } from 'express';
import { z } from 'zod';
import { getStore } from '../store/firestore.js';
import { AppError } from '../middleware/errors.js';
import { createSessionToken } from '../auth/session.js';

/** Demo sign-in: issues a signed, expiring, workplace-scoped admin session. */
export const sessionRouter = Router();

const adminSessionRequestSchema = z.object({
  workplaceId: z.string().min(1).max(64),
});

sessionRouter.post('/admin', async (req, res, next) => {
  try {
    const { workplaceId } = adminSessionRequestSchema.parse(req.body);
    const workplace = await getStore().getWorkplace(workplaceId);
    if (!workplace) {
      throw new AppError(404, 'WORKPLACE_NOT_FOUND', 'Workplace not found.');
    }
    res.json({ token: createSessionToken('admin', workplace.id), workplaceId: workplace.id });
  } catch (err) {
    next(err);
  }
});
