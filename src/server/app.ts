import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  securityHeaders,
  apiRateLimiter,
  addressRateLimiter,
  inviteRateLimiter,
  permissionsPolicy,
} from './middleware/security.js';
import { errorHandler } from './middleware/errors.js';
import { requireIdentity } from './auth/identity.js';
import { loadMembership } from './auth/membership.js';
import { healthRouter } from './routes/health.js';
import { accountRouter, publicRouter } from './routes/account.js';
import { workplaceRouter } from './routes/workplace.js';
import { reportsRouter } from './routes/reports.js';
import { leaveRouter } from './routes/leave.js';
import { complaintsRouter } from './routes/complaints.js';
import { assetLinks } from './routes/assetLinks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(permissionsPolicy);
  app.use(compression());
  app.use(express.json({ limit: '4mb' }));

  app.use('/api', addressRateLimiter, apiRateLimiter);
  app.use('/api/health', healthRouter);
  app.get('/.well-known/assetlinks.json', assetLinks);
  app.use('/api', publicRouter);
  app.use('/api/invites', inviteRateLimiter);
  app.use('/api', accountRouter);
  app.use(
    '/api/workplaces/:wp',
    requireIdentity,
    loadMembership,
    workplaceRouter,
    reportsRouter,
    leaveRouter,
    complaintsRouter
  );

  // Serve static frontend in production
  const clientDistCandidates = [
    path.resolve(__dirname, '../../client'),
    path.resolve(__dirname, '../../../dist/client'),
    // Running from source (tsx, tests): the repo's dist/client.
    path.resolve(__dirname, '../../dist/client'),
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
      // A missing file (an icon, a script) is a 404, not the app page: answering
      // it with index.html hides broken links and breaks the service worker.
      if (/\.[a-z0-9]+$/i.test(req.path)) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
