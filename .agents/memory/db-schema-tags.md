---
name: DB Schema Tags Export Bug
description: Missing export in schema/index.ts caused tagsTable not found build error
---

When adding new schema files to lib/db/src/schema/, always add the corresponding `export * from "./filename"` to lib/db/src/schema/index.ts immediately.

**Why:** esbuild resolves @workspace/db -> lib/db/src/index.ts -> ./schema -> schema/index.ts. If a new file is missing from schema/index.ts, the build fails with "No matching export" error that looks like a deeper issue but is simply a missing re-export.

**How to apply:** After writing any new lib/db/src/schema/*.ts file, immediately update schema/index.ts with the export line before proceeding.
