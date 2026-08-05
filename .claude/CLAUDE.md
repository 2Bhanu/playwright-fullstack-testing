# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Playwright + TypeScript test automation framework supporting both UI and API tests. Uses the Page Object Model with a custom chainable locator API, a typed API client built on Zod schemas, and Playwright fixtures for dependency injection.

## Common Commands

There are no npm scripts defined in `package.json`. Run everything via `npx` directly:

- **Run all tests**: `npx playwright test`
- **Run a single test file**: `npx playwright test tests/ui/example/example.spec.ts`
- **Run a single test by name**: `npx playwright test -g "Login with valid credentials"`
- **Run by tag**: `npx playwright test --grep @Dev`
- **Run a specific project (browser)**: `npx playwright test --project=chromium`
- **Headed mode**: `npx playwright test --headed` (already default; config sets `headless: false`)
- **Debug mode**: `npx playwright test --debug`
- **HTML report**: `npx playwright show-report`
- **Lint**: `npx eslint .`
- **Type check**: `npx tsc --noEmit`
- **Install browsers**: `npx playwright install`

## Environment Setup

Required `.env` file (see `.env.example`) with these keys, loaded via `dotenv` in `src/config/env.ts`:

- `FSR_BASE_HOST` — base host for `BasePage.navigate()` to prepend to page endpoints
- `FSR_BASE_USERNAME`, `FSR_BASE_PASSWORD` — used by example login tests

`process.env.CI` toggles CI behavior: 2 retries, single worker, `forbidOnly` for `.only` checks.

## Architecture

### Directory layout

```
src/
  config/env.ts                          # Env loader + validated Env object
  api/
    endpoint.ts                          # (empty placeholder)
    Clients/
      ApiClientManager.ts                # Generic client factory
      BaseApiClient.ts                   # Abstract base (headers, auth)
      UserManagementClient.ts            # User API methods
      requests.ts                        # ApiRequest type
  framework/
    pages/
      base/basepage.ts                   # BasePage with chainable locator API
      components/commonComponentsPage.ts # Shared component locators
      pages/loginpage.ts                 # Concrete page object
    fixtures/
      pageFixture.ts                     # UI fixtures (loginPage, commonComponentsPage)
      schema.ts                          # Zod response schemas
      api/
        api-fixture.ts                   # apiClientManager fixture
        types-guards.ts                  # ApiRequestParams/Response, User/Error/Article types
    test-data/
      createData.ts                      # Template-based data generator
      deepMerge.ts                       # Deep merge utility
      types.ts                           # DeepPartial<T>
      schema/user.ts                     # UserData templates (z.object + activeUser/adminUser/inactiveUser)
    utils/utils.ts                       # utils.buildUrl(endpoint, baseURL)
tests/
  ui/example/*.spec.ts                   # Example UI tests (gitignored)
  api/example/*.ts                       # Example API tests (gitignored)
```

### Path aliases (from `tsconfig.json`)

`@/*`, `@api/*`, `@ui/*`, `@utils/*`, `@fixtures/*`, `@config/*`, `@types/*` — all map to `src/*` subfolders. Use these instead of relative imports.

### Page Object Model with chainable locators

`BasePage` is the key abstraction in `src/framework/pages/base/basepage.ts`. It implements a fluent locator chain: each role/filter/locator call mutates `this.currentLocator` and returns `this`, then a terminal action (`click()`, `fill()`, `hover()`, etc.) resolves the chain.

Key conventions:

- Subclasses define `endpoint: string` and a `readyLocator` used by `navigate()` to confirm page load.
- `navigate({ baseURL?, pageLoadCheck? })` defaults to `Env.fsrBaseHost` and asserts `readyLocator` is visible.
- Role helpers: `button()`, `textbox()`, `checkbox()`, `row()`, `cell()`, `link()`, `heading()` — all wrap `getByRole`.
- Text helpers: `text()`, `label()`, `placeholder()`, `testId()`.
- General helper: `locator(selector, options)` for CSS/XPath.
- `filter(options)` narrows the current chain.
- `chain()` / `resolveLocator()` are the internal mechanics — read these before extending.
- Locator helpers return `this` (typed via `BasePage extends this`), NOT `Locator`. To pass a real `Locator`, call `.resolveLocator()`. Action methods already do this internally.

### API client architecture

- `BaseApiClient` (`src/api/Clients/BaseApiClient.ts`) — abstract base holding `headers` map, with `setHeader()` / `setAuthToken()` (sets `Authorization: Bearer …`).
- `ApiClientManager` — constructor takes `APIRequestContext`, exposes `get<T>(ClientClass)` to instantiate any client class. Wired into tests via the `apiClientManager` fixture in `src/framework/fixtures/api/api-fixture.ts`.
- `UserManagementClient.ts` — currently a stub that logs and returns a fake 201. Real client subclasses should extend `BaseApiClient`.
- `requests.ts` — `ApiRequest<TPayload, TQuery, TPathParams, THeaders>` interface for typed payloads.
- Response validation: define Zod schemas in `src/framework/fixtures/schema.ts`, derive types via `z.infer<typeof Schema>` in `types-guards.ts`.

### Test data generation

`createData(schema, templates)` in `src/framework/test-data/createData.ts` returns a `{ schema, templates, generate(template, overrides?) }` object:

1. `templates` is a `Record<string, DeepPartial<z.infer<TSchema>>>` keyed by name.
2. `generate()` deep-merges the chosen template with optional overrides, then `schema.parse()`s the result — so the returned value is guaranteed valid against the schema.
3. Reference usage: `UserData.generate('activeUser', { email: 'override@test.com' })`.

### Fixtures

- UI: `src/framework/fixtures/pageFixture.ts` extends Playwright's base test with `loginPage` and `commonComponentsPage`. Import `test` and `expect` from there in UI specs.
- API: `src/framework/fixtures/api/api-fixture.ts` adds `apiClientManager`. Note: `apiClientManager` is a separate `test` export — UI specs and API specs use different `test` imports.

### TypeScript & linting

- Target: ES2022, strict mode on, CommonJS modules (`"type": "commonjs"` in `package.json`).
- ESLint enforces: `@typescript-eslint/no-floating-promises` and `no-misused-promises` are **errors** (must `await` Promises, no unhandled floats); `no-explicit-any` and unused-vars are warnings; alphabetical import order with newlines between groups.
- Tests have relaxed rules: `no-explicit-any` and unused-vars are off in `tests/**/*.ts`.
- Console: only `console.warn`, `console.error`, `console.info` are allowed; `console.log` warns (note: the example `UserManagementClient` uses `console.log` — avoid this pattern in new code).

### Gitignored paths

- `tests/ui/example/` and `tests/api/example/` are gitignored — examples are scratch only.
- `src/config/env.ts` is gitignored (contains `dotenv` side-effect import + `Env` object). When creating this file from scratch, copy the structure: `import * as dotenv from "dotenv"; dotenv.config();` then a `getEnv(name)` helper and a frozen `Env` const.
- `playwright-report/` and `test-results/` are gitignored.

## Adding a new page object

1. Create `src/framework/pages/pages/<name>page.ts` extending `BasePage`.
2. Set `endpoint`, `readyLocator`, and any constructor-initialized locators.
3. Add the page to `Fixtures` in `pageFixture.ts` and instantiate it in the `base.extend` block.
4. Use `import { test, expect } from '@/framework/fixtures/pageFixture';` in the spec file.

## Adding a new API client

1. Create `src/api/Clients/<Name>Client.ts` extending `BaseApiClient`.
2. Define method request types via `ApiRequest<Payload, Query, PathParams, Headers>`.
3. Add a Zod schema in `src/framework/fixtures/schema.ts` and export an inferred type in `types-guards.ts`.
4. If UI tests need it, wire into a fixture; if API-only, use the existing `apiClientManager.get(YourClient)` pattern.
