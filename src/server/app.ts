import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { securityHeaders, apiRateLimiter } from './middleware/security.js';
import { errorHandler } from './middleware/errors.js';
import { healthRouter } from './routes/health.js';
import { workerRouter } from './routes/worker.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { sessionRouter } from './routes/session.js';
import { qrRouter } from './routes/qr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(compression());
  app.use(express.json({ limit: '4mb' }));

  app.use('/api', apiRateLimiter);
  app.use('/api/health', healthRouter);
  app.use('/api/worker', workerRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/session', sessionRouter);
  app.use('/api/qr-svg', qrRouter);
  app.use('/api/admin', adminRouter);

  // Serve static frontend in production
  const clientDistCandidates = [
    path.resolve(__dirname, '../../client'),
    path.resolve(__dirname, '../../../dist/client'),
  ];
  const clientDist = clientDistCandidates.find((dir) =>
    fs.existsSync(path.join(dir, 'index.html'))
  );

  if (clientDist) {
    app.use(
      express.static(clientDist, {
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
