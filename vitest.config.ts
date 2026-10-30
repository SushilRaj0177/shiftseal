import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { NODE_ENV: 'test', AUTH_MODE: 'dev', STORE: 'memory' },
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/server/**', 'src/client/i18n/strings.ts'],
      exclude: [
        'src/server/index.ts', // process entry point
        'src/shared/types.ts', // type declarations only
        'src/server/data/repo.ts', // interface only
        'src/server/data/firestoreRepo.ts', // needs a live Firestore; exercised through MemoryRepo's contract
      ],
      reporter: ['text-summary', 'lcov'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 85,
        branches: 70,
      },
    },
  },
});
