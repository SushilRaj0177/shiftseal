import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/server/**', 'src/client/admin/formatCountdown.ts'],
      exclude: [
        'src/server/index.ts', // process entry point
        'src/shared/types.ts', // type declarations only
        'src/server/store/store.ts', // interface only
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
