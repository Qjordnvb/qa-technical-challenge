# Technical Challenge — QA Automation (TypeScript)

Working repository for a live technical challenge. Structured to handle whichever
challenge type comes up: UI end-to-end, API testing, or algorithmic/code exercises.

## Stack
- **TypeScript**
- **Playwright** (`@playwright/test`) — runs TS natively (no build step) for UI E2E, API, and code tests

## Setup
```bash
npm install
npx playwright install --with-deps chromium
```

## Run
```bash
npm test            # run all tests (UI + API + code)
npm run test:ui     # UI E2E tests only
npm run test:api    # API tests only
npm run test:unit   # algorithm/code challenge only (no browser)
npm run typecheck   # tsc --noEmit
npm run report      # open the last Playwright HTML report
```

## Layout
```
tests/
  example.e2e.spec.ts   # UI E2E sample — Page Object style, stable locators, web-first assertions
  api.spec.ts           # REST API sample — status, schema, negative cases
  solution.spec.ts      # runnable checks for the code challenge
src/
  solution.ts           # code-challenge scratchpad (edit live)
playwright.config.ts
tsconfig.json
```

## Notes on approach
- Prefer role/label/test-id locators over brittle CSS/XPath.
- Cover the happy path **and** boundary / negative / failure cases.
- Keep tests independent — each sets up and tears down its own state.

> If a **SQL** or **System Design** challenge comes up (no repo needed), add a
> `queries.sql` or `design.md` here live and commit it so the repo still reflects the work.
