import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';

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

const port = Number(process.env.PORT || 8080);
const app = createApp();

app.listen(port, '0.0.0.0', () => {
  console.log(`Shiftseal server listening on http://0.0.0.0:${port}`);
});
