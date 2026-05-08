<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

AgenciaHub is a single Next.js 16 (App Router) frontend for travel-agency management. Data is mock/localStorage-based — no database or backend is required to run the app. The Spring Boot backend (`agencia-hub-api`) lives in a separate repo and is optional.

### Dev commands

| Action | Command |
|---|---|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Build | `npm run build` |

### Login

The login page (`/login`) accepts **any non-empty email and password**. No real auth is configured.

### Gotchas

- Next.js 16.2.4 deprecates the `middleware` file convention in favor of `proxy`. The build emits a warning but succeeds.
- There is no automated test suite (`npm test` is not configured). Validation relies on type-checking, linting, and the build.
- The CI workflow (`.github/workflows/ci.yml`) runs `npx tsc --noEmit`, `npm run lint`, and `npm run build` on Node 20. Match this locally for parity.
