// Renders public/brand/*.svg (from make-icon.py) into every PNG the app and stores use.
// Needs Playwright with Chromium: node scripts/brand/render-icons.mjs
import { createRequire } from 'module';
import { readFileSync, readdirSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const brand = (f) => join(root, 'public', 'brand', f);
const res = join(root, 'android', 'app', 'src', 'main', 'res');

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [
  ['icon-full.svg', 192, brand('icon-192.png')],
  ['icon-full.svg', 512, brand('icon-512.png')],
  ['icon-maskable.svg', 512, brand('icon-maskable-512.png')],
  ['mark.svg', 256, brand('mark.png')],
  ['icon.svg', 64, join(root, 'public', 'favicon.png')],
  ['icon-full.svg', 180, join(root, 'public', 'apple-touch-icon.png')],
  ['icon-full.svg', 512, join(root, 'store', 'icon-512.png')],
];
for (const [d, k] of Object.entries(DENSITIES)) {
  const dir = join(res, `mipmap-${d}`);
  jobs.push(['icon.svg', 48 * k, join(dir, 'ic_launcher.png')]);
  jobs.push(['icon-background.svg', 108 * k, join(dir, 'ic_launcher_background.png')]);
  jobs.push(['icon-foreground.svg', 108 * k, join(dir, 'ic_launcher_foreground.png')]);
  jobs.push(['icon-monochrome.svg', 108 * k, join(dir, 'ic_launcher_monochrome.png')]);
}

// Every season's store icon, for previews and for swapping the Play listing icon.
for (const f of readdirSync(join(root, 'public', 'brand', 'seasons')).filter((n) => n.endsWith('.svg'))) {
  jobs.push([join('seasons', f), 512, join(root, 'store', 'seasons', f.replace('.svg', '-512.png'))]);
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, size, out] of jobs) {
  mkdirSync(dirname(out), { recursive: true });
  const svg = readFileSync(brand(src), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log(`rendered ${jobs.length} icons`);
