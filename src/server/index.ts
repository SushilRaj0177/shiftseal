import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { parseConfig } from './config.js';

function loadDotEnvIfNeeded(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadDotEnvIfNeeded();

const config = parseConfig(process.env);
const app = createApp();

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Shiftseal server listening on port ${config.PORT} (store: ${config.STORE})`);
});

// Cloud Run sends SIGTERM before stopping an instance: finish in-flight requests, then exit.
function shutdown(signal: string): void {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
