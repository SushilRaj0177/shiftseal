import { Router } from 'express';
import { getModelName } from '../gemini/client.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'shiftseal',
    store: process.env.STORE || 'memory',
    vertexai: process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true',
    model: getModelName(),
    timestamp: new Date().toISOString(),
  });
});
