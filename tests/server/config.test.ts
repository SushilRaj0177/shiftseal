import { describe, it, expect } from 'vitest';
import { parseConfig } from '../../src/server/config.js';

describe('runtime configuration', () => {
  it('applies safe defaults', () => {
    expect(parseConfig({})).toMatchObject({
      PORT: 8080,
      STORE: 'memory',
      GOOGLE_GENAI_USE_VERTEXAI: 'false',
      GOOGLE_CLOUD_LOCATION: 'global',
    });
  });

  it('accepts the Cloud Run production settings', () => {
    const config = parseConfig({
      PORT: '8080',
      STORE: 'firestore',
      GOOGLE_GENAI_USE_VERTEXAI: 'true',
      GOOGLE_CLOUD_PROJECT: 'promptwars-512900',
      GEMINI_MODEL: 'gemini-3.8-flash',
      SESSION_SECRET: 'a'.repeat(64),
    });
    expect(config.STORE).toBe('firestore');
    expect(config.PORT).toBe(8080);
  });

  it('treats blank lines from .env.example as unset', () => {
    const config = parseConfig({ FIREBASE_PROJECT_ID: '', SESSION_SECRET: '  ', PORT: '' });
    expect(config.FIREBASE_PROJECT_ID).toBeUndefined();
    expect(config.SESSION_SECRET).toBeUndefined();
    expect(config.PORT).toBe(8080);
  });

  it('rejects an unknown store, an invalid port and a weak session secret', () => {
    expect(() => parseConfig({ STORE: 'postgres' })).toThrow(/STORE/);
    expect(() => parseConfig({ PORT: '99999' })).toThrow(/PORT/);
    expect(() => parseConfig({ SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });

  it('never echoes secret values in validation errors', () => {
    expect(() => parseConfig({ SESSION_SECRET: 'tiny-secret' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('tiny-secret') })
    );
  });

  it('refuses development sign-in and missing secrets in production', () => {
    expect(() => parseConfig({ NODE_ENV: 'production', AUTH_MODE: 'dev' })).toThrow(/AUTH_MODE/);
    expect(() => parseConfig({ NODE_ENV: 'production', GOOGLE_CLOUD_PROJECT: 'p' })).toThrow(
      /SESSION_SECRET/
    );
    expect(
      parseConfig({
        NODE_ENV: 'production',
        GOOGLE_CLOUD_PROJECT: 'p',
        SESSION_SECRET: 'a'.repeat(40),
      }).AUTH_MODE
    ).toBe('firebase');
  });
});
