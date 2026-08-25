# CLAUDE.md

Master instruction file for AI sessions in this repository.
Always loaded — keep terse. Detailed guidance lives in skills.

---

## Project

Playwright fullstack testing framework for **UI** and **API** end-to-end tests.
Thin typed layer on top of `@playwright/test`:

- `BasePage` + `SimplifiedLocator` auto-stamps every locator action with a
  business-meaningful log line and `test.step` label.
- `BaseApiClient` + `SimplifiedRequest` provides a fluent chain
  (`.withAuth().withPayload().post()`).
- Test data is zod-schema + templates via `createData(...)`.
- Single import for tests:
  `import { test, expect } from '@/framework/fixtures/fixture_aggregator'`.

---

## Layout (terse)

| Path | Purpose |
|---|---|
| `src/framework/pages/<area>/` | `BasePage` subclasses, one per page |
| `src/framework/test-data/` | `createData`, `deepMerge`, `schema/<entity>.ts` |
| `src/api/Clients/` | `BaseApiClient` subclasses, `SimplifiedRequest`, `ApiClientManager` |
| `src/api/endpoint.ts` | `EndpointMap` — logical name → path |
| `src/config/env.ts` | `Env` singleton — never read `process.env` directly |
| `tests/ui/<feature>/` | UI specs |
| `tests/api/<feature>/` | API specs |

---

## Skill loading — conditional, NOT auto-load

Invoke skills **by name** only when the rule below matches. Do not pre-load.

| You are editing or authoring… | Invoke skill |
|---|---|
| `tests/ui/**/*.spec.ts` or `src/framework/pages/**` | `ui-test-author` |
| `tests/api/**/*.spec.ts` or `src/api/**` | `api-test-author` |
| `src/framework/**` (core/fixtures/logging/test-data/utils) | no skill — ask first |
| A UI test that needs API-based test-data creation (POST via API to seed DB before UI assertion) | load **both** `ui-test-author` **and** `api-test-author` |
| An API test that needs UI verification (POST then GET dashboard) | load **both** `api-test-author` **and** `ui-test-author` |

**Default: load exactly one skill, never both, unless the cross-load rule triggers.**

If unsure which skill applies, ask the user which surface the task targets.

---

## Conventions (non-negotiable)

Mirror these from the README — do not relax them in tests or skills.

| Don't | Do |
|---|---|
| Import from `@playwright/test` directly in test files | Import from `@/framework/fixtures/fixture_aggregator` |
| Write raw `page.locator(...)` in test files | Add a helper on the relevant `BasePage` subclass |
| Inline test data in a test | Use `SchemaData.generate(template, overrides)` |
| Hard-code endpoint paths in API tests | Use the `EndpointMap` in `src/api/endpoint.ts` |
| Skip `.setAsPageReadyIdentifier()` on a new page | Set it on the most prominent element |
| Use `await page.goto(...)` directly | Use `await <page>.navigate()` |
| Proactively invent a page-level helper for a single-use pattern | Inline the locator calls; flag the repetition to the user |
| Mock network calls without a comment explaining why | Always comment why a `page.route(...)` or `request.route(...)` was added |
| Add `test.step(...)` blocks inside a test file | Let the framework wrap each action in its own step |

---

## Test data — read this before writing any test

**Source of truth:** [`src/framework/test-data/createData.ts`](../src/framework/test-data/createData.ts)
(read it once; it is short). The factory takes a zod schema + a templates
record and returns `{ schema, templates, generate(template, overrides?) }`.

**Selection rule (today):** pick the template whose **name** matches the
scenario and pass any per-test overrides:

```ts
const admin = UserData.generate('adminUser', { name: 'Test Admin' });
```

**Adding a new template:** edit `src/framework/test-data/schema/<entity>.ts`
first. Do not inline literal objects in tests — the schema is the single
source of truth for the wire shape and the test data lives next to it.

**Roadmap (not yet implemented):** `SchemaData.pickFor(intent)` with a
constraint object (`when`, `requiredFor`, `notFor`) for deterministic
intent-driven template selection. Until then, choose the template by name.

**Per-skill "how to pick" rules** live in the UI and API skills
(~10 lines each). Do not duplicate the schema shape here — keep
`CLAUDE.md` terse and let the skills carry the workflow detail.

---

## Auth & secrets

- Credentials for API calls come from `AuthClient.getBearerToken()` /
  `getBasicAuth()` / `getApiKey()`. **Never** hard-code tokens,
  passwords, or API keys in tests or page classes.
- Environment values come from `Env` in `src/config/env.ts`.
  **Never** read `process.env` directly.

---

## Reporting

- Allure: `allure-report/` (do not hand-edit).
- `execution-log` artifact: auto-attached to every test via the
  `test_log` fixture. The locator Proxy emits one log line per action.
  **Do not** add manual `logger.info(...)` calls in tests —
  that duplicates the framework's output.
- Playwright report: `playwright-report/`.

---

## What NOT to do (summary)

- Do not modify `node_modules/`, `playwright-report/`,
  `allure-report/`, `allure-results/`, `test-results/`.
- Do not invent page-level helpers — surface repetition to the user.
- Do not add `test.step(...)` blocks inside test files.
- Do not load both UI and API skills unless the cross-load rule
  above explicitly triggers.
- Do not duplicate framework source-of-truth rules into skills;
  reference the file by path instead.

---

## Onboarding a new app

For a new app surface:

1. Clone `.claude/skills/business-context.template/` to
   `.claude/skills/business-context/` (when the template is added).
2. Populate `glossary.md` with terms + locator field names.
3. Add at least one journey under `journeys/`.
4. Open Claude Code in the repo — `CLAUDE.md` loads automatically.
5. Ask: "Author a test for the `<journey>` journey." Claude Code
   loads the right skill and walks through it.

For this repository as it stands (no `business-context/` yet),
treat the schema template names in `src/framework/test-data/schema/`
as the working glossary.
