import { z } from 'zod';

/** Typed, validated runtime configuration. Invalid settings fail fast at startup. */
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  STORE: z.enum(['memory', 'firestore']).default('memory'),
  GOOGLE_GENAI_USE_VERTEXAI: z.enum(['true', 'false']).default('false'),
  GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
  GOOGLE_CLOUD_LOCATION: z.string().min(1).default('global'),
  GEMINI_MODEL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function parseConfig(env: Record<string, string | undefined>): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid configuration: ${fields}`);
  }
  return result.data;
}
