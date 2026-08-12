# CLAUDE.md — AI Authoring Guide

This file is the **master instruction** for any AI session authoring tests
against this Playwright framework. It is always loaded into context. Read
it fully before doing anything.

The framework wraps Playwright in a typed layer (`BasePage`,
`SimplifiedLocator`, `BaseApiClient`, `createData`) so that:

- action **logs** are emitted automatically from locator field names,
- test **steps** are wrapped at the page-class level (not in tests),
- test **data** is always typed via zod and reused via templates.

Honour those three conventions at all times. The framework gives the AI a
narrow, predictable surface to author against — using the surface is the
point.

---

## 1. Framework at a glance

- **Language**: TypeScript, strict mode, path alias `@/* -> src/*`.
- **Test root**: `tests/` — UI tests under `tests/ui/<feature>/`,
  API tests under `tests/api/<feature>/`. Specs under `specs/`.
- **One import for everything** in a test file:

  ```ts
  import { test, expect } from '@/framework/fixtures/fixture_aggregator';
  ```

  This gives you `test`, `expect`, the page fixtures, the API client
  manager, and the logging context in a single line. **Never** import
  directly from `@playwright/test` in test files.
- **Reporting**: Playwright line reporter + Allure (`allure-results/`).
  Execution logs auto-attach as a Playwright artifact on every test via
  the `test_log` fixture.
- **Config**: `playwright.config.ts` keeps `headless: false`, `trace: 'retain-on-failure'`,
  `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

---

## 2. The locator name is the log statement

`BasePage` wraps itself in a `Proxy` that auto-stamps every read of a
`SimplifiedLocator` field with the **property name** on first read. That
name then flows into:

- the action log line emitted by `logger.info('Clicked {locatorName}')`,
- the `test.step(stepName, …)` label that appears in the Playwright report
  and Allure.

Therefore: **the field name is the only thing the user sees in the log
and in the report**. Pick it from the business term, not from the DOM.

### Rules

- Use `*Locator` or `*FieldLocator` / `*ButtonLocator` suffix so logs read
  naturally: `Clicked submitOrderButtonLocator`,
  `Filled usernameFieldLocator with "..."`.
- The name must match a term in the
  `.claude/skills/business-context/glossary.md`. If the glossary is
  missing the term, add it there first.
- Chained locators inherit the property name; `first-name-wins` means a
  later alias cannot rename. So pick the name once, on the field.
- Set one locator per page as the **page-ready identifier** via
  `.setAsPageReadyIdentifier()` — usually the most prominent element on
  the page (a heading, the primary form, a welcome banner). `BasePage.navigate()`
  asserts that locator is visible after the page loads.

### Anti-patterns

- `input1Locator`, `btnPrimaryLocator`, `divLocator` — never.
- Renaming via `const x = this.usernameLocator` and then `x.click()` — the
  log will still say `usernameLocator`, but it is misleading code; call
  the field directly.
- Chaining without purpose. If the chain produces a different name in the
  log, the field name was wrong; fix it on the page class.

### When you author a page class — load the UI skill

The full authoring flow (propose field, ask user, write test) is in
`.claude/skills/ui-test-author-interactive/SKILL.md`. **Load that skill
whenever you write or change a `BasePage` subclass.**

---

## 3. Tests are locator calls + page-level helpers, NOT test.step blocks

The framework does the test.step wrapping at the **page-class** level,
not at the test level. Tests stay flat: a sequence of locator actions
and page-level helper calls in plain order. The `test.step` names you
see in the report come from the framework wrappers — `await this.usernameFieldLocator.fill(...)`
emits a step called `Filled usernameFieldLocator with "..."`.

### Pattern in a test (the AI's default style)

```ts
test('Sign in as admin and open the user management panel', async ({ loginPage, dashboardPage }) => {
  await loginPage.navigate();

  await loginPage.usernameFieldLocator.fill(Env.adminUsername);
  await loginPage.passwordFieldLocator.fill(Env.adminPassword);
  await loginPage.submitSignInButtonLocator.click();

  await dashboardPage.openUserManagementPanel();
  await dashboardPage.userTableLocator.expectedToBeVisible();
});
```

Notice: **no `test.step(...)` in the test file**, just locator calls and
page-level helpers in business order. The framework emits the steps.

### Page-level helpers exist ONLY for repeated multi-step patterns

When the same multi-step pattern appears across several tests (e.g. "log
in", "create a draft order"), the **user** — not the AI — decides to
factor it into a page-level method like `loginPage.signInAs(...)`. The
AI may **use** such existing methods; it does **not** proactively
invent them.

Rule for the AI:

- A single locator action → call it directly in the test.
- 2-3 locator actions that appear in **only one** test → keep them inline.
- A repeated multi-step pattern → flag it to the user with the list of
  call sites, then let the user decide whether to factor. **Do not
  create the helper yourself.**

If a page-level helper already exists (e.g. `loginPage.signInAs(...)`),
use it; the framework has already wrapped its body in test.step blocks
on the page class side.

### Anti-patterns

- `await test.step('Sign in', async () => { ... })` inside a test — the
  framework already wraps at the page level. Adding test.step in tests
  double-wraps and fragments the report.
- Inventing a new `loginPage.signInAs(...)` helper because it would be
  "cleaner" — that is the user's call. Inline until they say otherwise.
- Wrapping a single locator call in a one-line helper on the page class
  — that is just an indirection; leave it in the test.

---

## 4. Test data only from schema files

**Never inline string literals for test data in a test.** Every piece of
test data must come from `src/framework/test-data/schema/*.ts` via
`createData(schema, templates, constraints)`.

### Pattern

```ts
import { UserData } from '@/framework/test-data/schema/user';

test('Sign in as admin', async ({ loginPage }) => {
  const admin = UserData.pickFor('admin-panel');   // picks the right template
  await loginPage.navigate();
  await loginPage.usernameFieldLocator.fill(admin.email);
  await loginPage.passwordFieldLocator.fill('some-password');
});
```

### Schema files MUST declare a constraint object

Every `createData(...)` call passes a third argument: a constraints map
keyed by template name. Each constraint has:

```ts
type TemplateConstraint = {
  /** Free-text description of WHEN this template is the right choice. */
  when: string;
  /** Lowercase tokens that the test description usually contains. */
  requiredFor: string[];
  /** Optional: explicitly exclude scenarios. */
  notFor?: string[];
};
```

`createData` returns `{ schema, templates, constraints, generate, pickFor }`.
Use `pickFor('<lowercase token from the test name>')` whenever the test
name does not explicitly name a template. Use `generate('templateName',
overrides?)` only when the test name explicitly references the template
by name.

### Anti-patterns

- `const username = 'john@test.com'` — inline, forbidden.
- `UserData.generate('adminUser')` when the test name does not say
  "admin" — bypasses the constraint; use `pickFor` instead.
- Pulling values from `process.env` directly in a test — go through
  `Env` in `src/config/env.ts`.

---

## 5. Logs auto-attach as artifacts

The `test_log` fixture is auto-on (`{ auto: true }`). Every log line
emitted by `logger.info/warn/error/debug` during a test is collected via
`AsyncLocalStorage` and attached to the test report as `execution-log`
(text/plain). Do not duplicate log calls in test code.

The framework emits the action log line for every locator call (because
of rule 2 — the locator field name flows into the log). If you need
extra context, write a short domain comment above the test instead of
inventing a log line.

---

## 6. Two authoring modes

### Interactive (default — preferred)

The user narrates a journey. The AI asks clarifying questions, proposes
a page class, proposes the test outline, picks the test data, and only
then writes code. Triggered by the skills:

- `.claude/skills/ui-test-author-interactive/SKILL.md` — UI journeys.
- `.claude/skills/api-test-author/SKILL.md` — API journeys.

**Always prefer interactive.** Non-interactive generation is best-effort
and may need human review.

### Non-interactive (fallback)

Invoked by the customized `playwright-test-generator` agent when given
a self-contained `specs/*.plan.md` file. The agent imports from the
framework, follows the same conventions, and writes the test file. It
does not ask questions — it does its best with the spec it has.

If the spec is ambiguous, the agent must mark the test `test.fixme(...)`
with a comment explaining what was unclear rather than guess.

---

## 7. Business context is mandatory

Before authoring any test, load the `.claude/skills/business-context/`
skill. If that skill does not exist, copy the template from
`.claude/skills/business-context.template/` to
`.claude/skills/business-context/`, rename it, and populate:

- `glossary.md` — every business term and its locator field name.
- `journeys/<journey>.md` — at least one journey, ideally all P0/P1.

**Do not proceed with test authoring until the glossary has the term
and at least one journey is documented.** This is non-negotiable: the
locator name and the test data both flow from the glossary.

---

## 8. What NOT to do

| Don't | Do |
|---|---|
| Import from `@playwright/test` directly in test files | Import from `@/framework/fixtures/fixture_aggregator` |
| Add `test.step(...)` blocks inside a test file | Let the framework wrap each action in its own step |
| Inline test data in a test | Use `SchemaData.pickFor(...)` or `generate(...)` |
| Hard-code endpoint paths in API tests | Use the `EndpointMap` in `src/api/endpoint.ts` |
| Skip `.setAsPageReadyIdentifier()` on a new page | Set it on the most prominent element |
| Use `await page.goto(...)` directly | Use `await <page>.navigate()` |
| Proactively invent a page-level helper for a single-use pattern | Inline the locator calls; flag the repetition to the user |
| Mock network calls without a comment explaining why | Always comment why a `page.route(...)` or `request.route(...)` was added |

---

## 9. Directory map (quick reference)

```
.claude/
├── CLAUDE.md                          ← you are here
├── agents/                            ← Playwright agents (framework-aware)
├── skills/
│   ├── playwright-cli/                ← stock Microsoft skill — leave alone
│   ├── ui-test-author-interactive/    ← UI interactive authoring
│   ├── api-test-author/               ← API interactive authoring
│   ├── business-context/              ← cloned per-app from the template
│   └── business-context.template/     ← clone from here
src/
├── api/
│   ├── Clients/                       ← API clients, all extend BaseApiClient
│   └── endpoint.ts                    ← EndpointMap (single source of truth)
├── config/env.ts                      ← Env singleton
└── framework/
    ├── core/simplified_locator.ts     ← SimplifiedLocator wrapper
    ├── pages/base/basepage.ts         ← BasePage + Proxy
    ├── fixtures/fixture_aggregator.ts ← import from here in tests
    ├── fixtures/api/                  ← API fixture, schemas, type guards
    ├── logging/                       ← logger + AsyncLocalStorage context
    ├── test-data/
    │   ├── createData.ts              ← schema factory with constraints
    │   ├── deepMerge.ts
    │   └── schema/                    ← one *.ts file per domain entity
    └── utils/utils.ts
tests/
├── ui/<feature>/<journey>.spec.ts
└── api/<feature>/<journey>.spec.ts
specs/
└── <feature>.plan.md                  ← produced by planner agent
```

---

## 10. Quick-start recipes

### Add a new UI page

1. Load `.claude/skills/business-context/`. Confirm the term is in the
   glossary.
2. Create `src/framework/pages/<area>/<PageName>.ts` extending `BasePage`.
3. Declare each locator as a field, named per the glossary, suffixed
   `Locator`. One of them ends with `.setAsPageReadyIdentifier()`.
4. **Do not add page-level helper methods unless the user has asked for
   one or the same multi-step pattern appears in 3+ existing tests.**
5. If the page needs new test data, add a schema file under
   `src/framework/test-data/schema/` with constraints.
6. Register the page in `src/framework/fixtures/pageFixture.ts` so the
   fixture exposes it.

### Add a new UI test

1. Load `.claude/skills/ui-test-author-interactive/`.
2. Identify the journey (existing or new). Add a journey file if new.
3. Pick page fixtures from `fixture_aggregator`.
4. Write the test as a flat sequence of locator calls and existing
   page-level helpers (no `test.step` in the test file).
5. Source data via `SchemaData.pickFor('<intent>')`.
6. Run via `npx playwright test <path>`.

### Add a new API test

1. Load `.claude/skills/api-test-author/`.
2. Confirm the endpoint is in `EndpointMap` (add it if not).
3. Confirm the request and response zod schemas exist (add under
   `src/framework/fixtures/schema.ts` if not).
4. Add a method on the relevant `BaseApiClient` subclass if not present.
5. Write the test as a flat sequence of client calls and assertions
   (no `test.step` in the test file).
6. Run via `npx playwright test <path>`.

---

## 11. Working agreements

- **Ask before adding dependencies.** The framework is intentionally lean.
- **One file per concern.** Page class in its own file. Schema in its own
  file. Client in its own file.
- **Comments are for the next reader, not for the AI.** Do not write
  `// TODO: AI-generated`. Write comments that explain WHY a choice was
  made.
- **Tests stay green.** If a test you wrote fails, fix the framework or
  the test — never mark it `.skip()` without a comment explaining why and
  a link to a ticket or chat.
- **Allure tags**: tag smoke tests `@smoke`, regression `@regression`,
  work-in-progress `@wip`. Tags are surfaced in the Allure report.
