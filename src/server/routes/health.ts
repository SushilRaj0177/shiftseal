import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'shiftseal',
    store: process.env.STORE || 'memory',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
  });
});
