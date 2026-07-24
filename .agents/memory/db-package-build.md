---
name: DB Package Build
description: lib/db must be compiled before api-server TypeScript checks pass after schema changes
---

## Rule
After adding any new schema file to `lib/db/src/schema/` and exporting it from `schema/index.ts`, run:

```bash
pnpm --filter @workspace/db exec tsc --build
```

**before** running `pnpm --filter @workspace/api-server exec tsc --noEmit`.

**Why:** `lib/db/tsconfig.json` has `composite: true` + `emitDeclarationOnly: true`. The api-server tsconfig lists `lib/db` as a project reference, so TypeScript resolves types from `lib/db/dist/` declaration files, NOT from the raw `.ts` source. If `dist/` is stale, the new export won't appear and you get "has no exported member" even though the source and esbuild bundle are fine.

**How to apply:** Any time a new Drizzle table is added, always do the tsc build step for `@workspace/db` before checking the api-server types or declaring the task done.
