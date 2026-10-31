import { z } from 'zod/v3';

/** Typed, validated runtime configuration. Invalid settings fail fast at startup. */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    STORE: z.enum(['memory', 'firestore']).default('memory'),
    GOOGLE_GENAI_USE_VERTEXAI: z.enum(['true', 'false']).default('false'),
    GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
    GOOGLE_CLOUD_LOCATION: z.string().min(1).default('global'),
    GEMINI_MODEL: z.string().min(1).optional(),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
    /** `firebase` verifies Firebase ID tokens; `dev` accepts `dev:<uid>` tokens for local work. */
    AUTH_MODE: z.enum(['firebase', 'dev']).default('firebase'),
    FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    FIREBASE_WEB_API_KEY: z.string().min(1).optional(),
    FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
    /** The Android app's package name; turns on Play Integrity checks and app links. */
    ANDROID_PACKAGE: z
      .string()
      .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
      .optional(),
    /** SHA-256 fingerprints of the app's signing certificates, comma-separated (Play Console, App signing). */
    ANDROID_CERT_SHA256: z
      .string()
      .regex(/^([0-9A-F]{2}(:[0-9A-F]{2}){31})(,\s*[0-9A-F]{2}(:[0-9A-F]{2}){31})*$/i)
      .optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.AUTH_MODE === 'dev') {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_MODE'],
        message: 'dev auth is not allowed in production',
      });
    }
    if (!env.SESSION_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['SESSION_SECRET'], message: 'required in production' });
    }
    if (!env.FIREBASE_PROJECT_ID && !env.GOOGLE_CLOUD_PROJECT) {
      ctx.addIssue({
        code: 'custom',
        path: ['FIREBASE_PROJECT_ID'],
        message: 'required in production',
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export function parseConfig(env: Record<string, string | undefined>): AppConfig {
  // A blank line in .env (`KEY=`) means "not set", not "set to nothing".
  const present = Object.fromEntries(Object.entries(env).filter(([, v]) => v?.trim()));
  const result = envSchema.safeParse(present);
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid configuration: ${fields}`);
  }
  return result.data;
}

let current: AppConfig | null = null;

/** The configuration for this process, parsed once from the environment. */
export function getConfig(): AppConfig {
  if (!current) current = parseConfig(process.env);
  return current;
}

/** Tests only: re-read the environment. */
export function resetConfig(): void {
  current = null;
}
