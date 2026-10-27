# Contributing

1. `npm ci`
2. Make your change with tests. Business rules live in `src/shared/rules/` as pure functions.
3. Before opening a pull request, all of these must pass:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test:coverage   # enforces coverage thresholds
npm run build
```

Conventions: TypeScript strict mode, no `any`, zod validation for every API input, no secrets in code, user-facing text in `src/shared/i18n` (English, Tamil, Hindi). Architecture decisions are recorded in `docs/adr/`.
