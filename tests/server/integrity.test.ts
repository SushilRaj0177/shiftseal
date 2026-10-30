import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { resetConfig } from '../../src/server/config.js';
import { judgeIntegrity, verifyIntegrity } from '../../src/server/services/integrity.js';

const PKG = 'dev.sushilraj.shiftseal';
const NOW = 1_800_000_000_000;
const good = {
  requestDetails: { requestPackageName: PKG, nonce: 'n1', timestampMillis: String(NOW - 10_000) },
  appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED', packageName: PKG },
  deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_DEVICE_INTEGRITY'] },
};

describe('Play Integrity', () => {
  it('passes the genuine app on a genuine device for this check', () => {
    expect(judgeIntegrity(good, PKG, 'n1', NOW)).toBe('passed');
  });
  it('fails a token made for another check', () => {
    expect(judgeIntegrity(good, PKG, 'other', NOW)).toBe('failed');
  });
  it('fails an old token', () => {
    expect(judgeIntegrity(good, PKG, 'n1', NOW + 10 * 60_000)).toBe('failed');
  });
  it('fails a sideloaded or modified app', () => {
    const p = {
      ...good,
      appIntegrity: { ...good.appIntegrity, appRecognitionVerdict: 'UNRECOGNIZED_VERSION' },
    };
    expect(judgeIntegrity(p, PKG, 'n1', NOW)).toBe('failed');
  });
  it('fails an emulator or rooted device', () => {
    const p = {
      ...good,
      deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_VIRTUAL_INTEGRITY'] },
    };
    expect(judgeIntegrity(p, PKG, 'n1', NOW)).toBe('failed');
  });
  it('is unavailable for the web app or without a token', async () => {
    expect(await verifyIntegrity('tok', 'web', 'n1')).toBe('unavailable');
    expect(await verifyIntegrity(undefined, 'android', 'n1')).toBe('unavailable');
  });
});

describe('Android app links', () => {
  afterEach(() => {
    delete process.env.ANDROID_PACKAGE;
    delete process.env.ANDROID_CERT_SHA256;
    resetConfig();
  });

  it('lists nothing until the app is configured', async () => {
    resetConfig();
    const res = await request(createApp()).get('/.well-known/assetlinks.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('names the package and its signing certificate', async () => {
    const cert = Array.from({ length: 32 }, () => 'ab').join(':');
    process.env.ANDROID_PACKAGE = PKG;
    process.env.ANDROID_CERT_SHA256 = cert;
    resetConfig();
    const res = await request(createApp()).get('/.well-known/assetlinks.json');
    expect(res.body[0].target).toEqual({
      namespace: 'android_app',
      package_name: PKG,
      sha256_cert_fingerprints: [cert.toUpperCase()],
    });
  });
});
