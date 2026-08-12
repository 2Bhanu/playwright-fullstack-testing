# Playwright Fullstack Testing Framework

A typed, AI-friendly Playwright framework for **UI** and **API** end-to-end testing. Wraps Playwright in a thin layer that:

- auto-stamps every action with a business-meaningful log line and `test.step` label,
- sources all test data from typed zod schemas with constraint objects,
- exposes a single import for tests (`test`, `expect`, page fixtures, API client manager, logging context),
- ships with first-class authoring guidance for AI agents (Claude Code).

Designed for teams who want their test reports to read like business documentation, and who want AI to author tests against a narrow, predictable surface instead of raw Playwright calls.

---

## Table of contents

1. [What makes this framework special](#what-makes-this-framework-special)
2. [Quick start](#quick-start)
3. [General capabilities](#general-capabilities)
4. [Project layout](#project-layout)
5. [AI-assisted development](#ai-assisted-development)
6. [Framework conventions](#framework-conventions)
7. [Writing a test](#writing-a-test)
8. [Reporting — Allure + execution logs](#reporting--allure--execution-logs)
9. [Roadmap](#roadmap)
10. [Contributing](#contributing)

---

## What makes this framework special

Most Playwright projects accumulate the same kind of tech debt: brittle CSS selectors, inline test data, locator chains scattered through test files, and reports that nobody reads because every step is named `click1` or `fill1`. This framework addresses each of those problems with a single, principled layer on top of Playwright.

### 1. The locator field name IS the log statement (and the test step)

Every `SimplifiedLocator` field on a `BasePage` subclass is read through a `Proxy` that auto-stamps the **property name** on first read. That name then flows into:

- the action log line emitted by `logger.info('Clicked {locatorName}')`,
- the `test.step(stepName, …)` wrapper that produces the report label.

A test like this:

```ts
await loginPage.usernameFieldLocator.fill('alice@test.com');
await loginPage.passwordFieldLocator.fill('secret');
await loginPage.submitSignInButtonLocator.click();
```

…produces these step labels in the Playwright report and Allure, automatically:

```
Filled usernameFieldLocator with "alice@test.com"
Filled passwordFieldLocator with "secret"
Clicked submitSignInButtonLocator
```

No manual `test.step(...)` calls in the test file. The framework emits the steps at the page-class level.

### 2. Test data is typed and template-driven

Every piece of test data comes from `src/framework/test-data/schema/*.ts` via `createData(schema, templates, constraints)`. Templates are the defaults; the constraints map tells the AI which template fits which scenario.

```ts
export const UserData = createData(
  z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["USER", "ADMIN"]),
    active: z.boolean(),
  }),
  {
    activeUser:   { name: "John Doe",  email: "john@test.com",  role: "USER",  active: true  },
    adminUser:    { name: "Admin",     email: "admin@test.com", role: "ADMIN", active: true  },
    inactiveUser: { name: "Inactive",  email: "inactive@test.com", role: "USER", active: false },
  },
  {
    activeUser:   { when: "default happy-path user",                requiredFor: ["login", "browse", "purchase"] },
    adminUser:    { when: "scenario needs elevated permissions",    requiredFor: ["admin-panel", "user-management"] },
    inactiveUser: { when: "scenario asserts disabled-account state", requiredFor: ["account-deactivation", "login-blocked"] },
  }
);
```

Tests pick the right template without guessing:

```ts
const admin = UserData.pickFor('admin-panel');  // returns adminUser
await loginPage.usernameFieldLocator.fill(admin.email);
```

`pickFor(<lowercase token from the test name>)` does a deterministic substring match against the constraints and throws on ambiguity.

### 3. Custom Playwright wrapper — `SimplifiedLocator`

`SimplifiedLocator` ([src/framework/core/simplified_locator.ts](src/framework/core/simplified_locator.ts)) wraps Playwright's `Locator` with:

- Role-typed accessors: `button({ name })`, `textbox({ name })`, `link()`, `heading()`, `row()`, `cell()`, `dialog()`, `tab()`, `combobox()`, `switch()`, `alert()`, `radio()`, `checkbox()`, `option()`.
- Text-based locators: `text(s)`, `label(s)`, `placeholder(s)`.
- Test-id and CSS fallback: `testId(id)`, `locator(selector)`.
- Chaining that **inherits the property name** (first-name-wins, so renaming via aliasing is impossible).
- Domain assertions: `expectedToBeVisible()`, `expectedToBeEnabled()`, `expectedToBeChecked()`, `expectTextToBe()`, `expectValueToBe()`, `expectAttributeToBe()`, `expectCountToBe()`.

The chained name inheritance is the secret sauce: `usernameLocator.first().click()` still logs as `Clicked usernameLocator`. You get the read order of role-based locators with the consistency of a single name throughout the report.

### 4. `BasePage` Proxy — zero-boilerplate page classes

```ts
export class LoginPage extends BasePage {
  endpoint: string = '/login';
  usernameFieldLocator = this.simplifiedLocator.textbox({ name: 'Username' })
    .setAsPageReadyIdentifier();
  passwordFieldLocator = this.simplifiedLocator.textbox({ name: 'Password' });
  submitSignInButtonLocator = this.simplifiedLocator.button({ name: 'Sign in' });
}
```

`BasePage` returns a `Proxy` from its constructor that auto-stamps any `SimplifiedLocator` field with its property name on first read. `setAsPageReadyIdentifier()` registers the locator so `BasePage.navigate()` asserts the page has loaded.

### 5. Single import for tests

```ts
import { test, expect } from '@/framework/fixtures/fixture_aggregator';
```

This gives you `test`, `expect`, all page fixtures, the API client manager, and the logging context in one line. No more juggling five different imports per test.

### 6. Auto-attached execution logs

The `test_log` fixture is auto-on. Every log line emitted by `logger.info/warn/error/debug` during a test is collected via `AsyncLocalStorage` and attached to the test report as `execution-log` (text/plain). The framework writes the log lines for you (via the locator Proxy), so you get a per-test log artifact with zero test-side boilerplate.

### 7. Flat tests — no `test.step` in tests

The framework wraps each locator action in `test.step` at the page-class level. Tests stay flat:

```ts
test('Sign in as admin and open the user management panel', async ({ loginPage, dashboardPage }) => {
  await loginPage.navigate();

  await loginPage.usernameFieldLocator.fill(admin.email);
  await loginPage.passwordFieldLocator.fill(admin.password);
  await loginPage.submitSignInButtonLocator.click();

  await dashboardPage.userTableLocator.expectedToBeVisible();
});
```

No `test.step('Sign in', async () => { … })` blocks. The framework emits the steps.

### 8. Page-level helpers — user-authored, AI-used

When the same multi-step pattern repeats across tests (e.g. "log in", "create a draft order"), the **user** factors it into a page-level method like `loginPage.signInAs(...)`. The framework wraps the helper's body in `test.step` blocks on the page-class side, so the report shows each sub-step inside the helper. The AI uses existing helpers but does **not** invent new ones — that's a user decision.

---

## Quick start

```bash
git clone https://github.com/2Bhanu/playwright-fullstack-testing.git
cd playwright-fullstack-testing
npm install
npx playwright install chromium
cp .env.example .env   # fill in FSR_BASE_HOST / FSR_BASE_USERNAME / FSR_BASE_PASSWORD
npm test               # run all tests
```

Open the report:

```bash
npm run test:report:allure
```

Or run a single test:

```bash
npx playwright test tests/ui/<feature>/<journey>.spec.ts
```

Open the Playwright debug UI:

```bash
PWDEBUG=cli npx playwright test tests/ui/<feature>/<journey>.spec.ts
```

---

## General capabilities

### UI testing

- **Typed `BasePage` layer** with auto-stamped locator names.
- **Auto page-ready identifier**: `.setAsPageReadyIdentifier()` on one locator per page; `BasePage.navigate()` asserts it is visible after navigation.
- **Role-based locators** (`button`, `textbox`, `link`, `heading`, `row`, `cell`, `dialog`, `tab`, `combobox`, `switch`, `alert`, `radio`, `checkbox`, `option`) — semantic locators that survive markup changes.
- **Chained locators** that inherit the property name (`first-name-wins`).
- **Domain assertions** (`expectedToBeVisible`, `expectTextToBe`, etc.) that wrap Playwright's `expect(...)`.
- **Auto-attached execution logs** via the `test_log` fixture.
- **Allure integration** out of the box — reporter registered in `playwright.config.ts`.

### API testing

- **`BaseApiClient`** with header management and token-based auth (`setAuthToken`, `setHeader`).
- **`ApiClientManager`** fixture that hands out typed clients by class.
- **zod schemas** for request and response in `src/framework/fixtures/schema.ts` — single source of truth for the wire format.
- **Test data via `SchemaData.pickFor(...)`** — same pattern as UI tests.

> The API surface is intentionally small at the moment. The next iteration adds a real `BaseApiClient.request(...)` that resolves an endpoint from an `EndpointMap`, attaches auth, hits Playwright's `APIRequestContext`, and parses the body through a passed-in zod schema. See [Roadmap](#roadmap).

### Test data

- **`createData(schema, templates, constraints)`** factory in [src/framework/test-data/createData.ts](src/framework/test-data/createData.ts).
- **Constraints** declare when each template is the right choice, with `when` and `requiredFor[]` and optional `notFor[]`.
- **`pickFor(intent)`** returns the template whose constraints match the test name. `generate(templateName, overrides?)` for explicit calls.
- **Deep merge** of overrides in [src/framework/test-data/deepMerge.ts](src/framework/test-data/deepMerge.ts).

### Logging

- **`logger`** ([src/framework/logging/logger.ts](src/framework/logging/logger.ts)) — simple, structured, with timestamp + level.
- **`AsyncLocalStorage`** context ([src/framework/logging/test_logging_context.ts](src/framework/logging/test_logging_context.ts)) so every log line is automatically scoped to the running test.
- **`test_log` fixture** ([src/framework/fixtures/log_fixture.ts](src/framework/fixtures/log_fixture.ts)) attaches the per-test log as a Playwright artifact named `execution-log` (text/plain).
- The framework emits log lines from every locator action — tests do not duplicate log calls.

### Reporting

- **Playwright line reporter** + **Allure** (`allure-playwright`).
- **Trace, screenshot, video** on failure only (`retain-on-failure`).
- **`execution-log` artifact** attached on every test via the logging fixture.

### Environment configuration

- **`Env`** in [src/config/env.ts](src/config/env.ts) is the single source for environment variables. Tests never read `process.env` directly.
- **`.env` is git-ignored**; `.env.example` is the template.

### TypeScript & linting

- **Strict mode** with `path alias @/* -> src/*`.
- **ESLint** with `@typescript-eslint`, `eslint-plugin-playwright`, and `eslint-plugin-import`.
- **Prettier** for formatting.
- **`@typescript-eslint/no-floating-promises`** is `error` — you cannot forget an `await`.

---

## Project layout

```
.claude/
├── CLAUDE.md                              ← master instruction for AI sessions (always loaded)
├── PLAN-ai-assisted-development.md        ← design notes
├── agents/                                ← framework-aware Playwright agents
│   ├── playwright-test-generator.md       ← non-interactive generator
│   ├── playwright-test-healer.md          ← framework-aware healer
│   └── playwright-test-planner.md         ← planner with framework metadata
└── skills/
    ├── playwright-cli/                    ← Microsoft stock skill (leave alone)
    ├── ui-test-author-interactive/        ← UI interactive authoring
    ├── api-test-author/                   ← API interactive authoring
    ├── business-context/                  ← cloned per-app from the template
    └── business-context.template/         ← clone from here

src/
├── api/
│   ├── Clients/                           ← API clients, all extend BaseApiClient
│   └── endpoint.ts                        ← EndpointMap (single source of truth)
├── config/env.ts                          ← Env singleton
└── framework/
    ├── core/simplified_locator.ts         ← SimplifiedLocator wrapper
    ├── pages/base/basepage.ts             ← BasePage + Proxy
    ├── fixtures/
    │   ├── fixture_aggregator.ts          ← single import point for tests
    │   ├── pageFixture.ts                 ← page fixtures
    │   ├── api/                           ← API fixture, schemas, type guards
    │   └── log_fixture.ts                 ← logging fixture (auto)
    ├── logging/                           ← logger + AsyncLocalStorage
    ├── test-data/
    │   ├── createData.ts                  ← schema factory with constraints
    │   ├── deepMerge.ts
    │   └── schema/                        ← one *.ts per domain entity
    └── utils/utils.ts

tests/
├── ui/<feature>/<journey>.spec.ts
└── api/<feature>/<journey>.spec.ts

specs/
└── <feature>.plan.md                      ← produced by planner agent
```

---

## AI-assisted development

The framework ships with a complete authoring layer for Claude Code (and any other agent that loads `CLAUDE.md` and skills). The goal: an AI session can write end-to-end business-level tests against the framework, naming locators and test data consistently, without you having to hand-hold each step.

### What is included

```
.claude/
├── CLAUDE.md                              ← always loaded, master rules
├── agents/
│   ├── playwright-test-generator.md       ← non-interactive (spec → code)
│   ├── playwright-test-healer.md          ← framework-aware healing
│   └── playwright-test-planner.md         ← framework-aware planning
└── skills/
    ├── ui-test-author-interactive/        ← interactive UI authoring
    ├── api-test-author/                   ← interactive API authoring
    ├── business-context/                  ← per-app glossary + journeys
    └── business-context.template/         ← clone from here
```

### Two authoring modes

#### Interactive (default — preferred)

The user narrates a journey. The AI asks clarifying questions, proposes a page class, proposes the test outline, picks the test data, and only then writes code. Triggered by the skills:

- `ui-test-author-interactive` — UI journeys.
- `api-test-author` — API journeys.

Interactive mode produces reviewable diffs at every step (propose → confirm → implement) and never silently invents page-level helpers — those are user decisions.

#### Non-interactive (fallback)

The customized `playwright-test-generator` agent takes a self-contained `specs/*.plan.md` file and produces a test. It does not ask questions. Use this for batch generation from a planner-produced spec.

### The business-context layer

Every test flows from the business glossary. Without it, the AI has to guess:

- what the app does,
- which journeys matter,
- what to call each locator and each field,
- which test-data template fits a given scenario.

The framework ships a template at `.claude/skills/business-context.template/`. Clone it to `.claude/skills/business-context/` and populate:

- `glossary.md` — every business term and its locator field name (the single source of truth for naming).
- `journeys/<journey>.md` — one file per user journey, with steps in plain English and `expect:` bullets.

The AI loads the skill, refuses to author against un-glossary'd terms, and surfaces "Glossary gaps" so the user can populate the glossary in one pass before any code is written.

### What the AI will (and will not) do

The AI **will**:

- propose page-class changes with locator names from the glossary,
- propose test outlines as flat sequences of locator calls,
- pick test data via `SchemaData.pickFor(...)`,
- write the test file, the page class, and the schema in one pass after confirmation,
- run the test via `playwright-cli` in interactive mode,
- surface the Allure tag and the journey file changes in the hand-back.

The AI **will not**:

- invent page-level helper methods (the user decides when to factor),
- add `test.step(...)` blocks inside test files (the framework wraps at the page level),
- inline test data in tests,
- skip the page-ready identifier on a new page,
- run `playwright-cli` during non-interactive generation.

### Onboarding the AI for a new app

1. Clone `.claude/skills/business-context.template/` to `.claude/skills/business-context/`.
2. Populate `glossary.md` with the terms for the surface you want to test first.
3. Add at least one journey under `journeys/`.
4. Open Claude Code in the repo and start a session. The AI loads `CLAUDE.md` automatically.
5. Ask: "Author a test for the `<journey>` journey." The AI loads the UI or API skill and walks you through it.

### Customizing the stock agents

The three stock Playwright agents (`.claude/agents/`) are customized with a "Framework awareness" block that mirrors `CLAUDE.md`. If you fork the framework, keep that block in sync when you change conventions — the agents inherit the rules.

---

## Framework conventions

These are the non-negotiable rules. They live in `.claude/CLAUDE.md` and are repeated in the UI/API skills and the three agents.

| Don't | Do |
|---|---|
| Import from `@playwright/test` directly in test files | Import from `@/framework/fixtures/fixture_aggregator` |
| Write raw `page.locator(...)` in test files | Add a helper on the relevant `BasePage` subclass |
| Inline test data in a test | Use `SchemaData.pickFor(...)` or `generate(...)` |
| Hard-code endpoint paths in API tests | Use the `EndpointMap` in `src/api/endpoint.ts` |
| Skip `.setAsPageReadyIdentifier()` on a new page | Set it on the most prominent element |
| Use `await page.goto(...)` directly | Use `await <page>.navigate()` |
| Proactively invent a page-level helper for a single-use pattern | Inline the locator calls; flag the repetition to the user |
| Mock network calls without a comment explaining why | Always comment why a `page.route(...)` or `request.route(...)` was added |
| Add `test.step(...)` blocks inside a test file | Let the framework wrap each action in its own step |

---

## Writing a test

### Step 1 — pick the page(s)

Every page lives at `src/framework/pages/<area>/<PageName>.ts` and extends `BasePage`. Page fixtures are registered in `src/framework/fixtures/pageFixture.ts` and exposed via `fixture_aggregator`.

### Step 2 — name the locator from the glossary

```ts
export class LoginPage extends BasePage {
  endpoint: string = '/login';
  usernameFieldLocator = this.simplifiedLocator
    .textbox({ name: 'Username' })
    .setAsPageReadyIdentifier();
  passwordFieldLocator = this.simplifiedLocator
    .textbox({ name: 'Password' });
  submitSignInButtonLocator = this.simplifiedLocator
    .button({ name: 'Sign in' });
}
```

The `username` term must already exist in `.claude/skills/business-context/glossary.md`. If it doesn't, add it first.

### Step 3 — write the test as a flat sequence

```ts
import { test, expect } from '@/framework/fixtures/fixture_aggregator';
import { Env } from '@/config/env';
import { UserData } from '@/framework/test-data/schema/user';

test('Sign in as admin', { tag: '@smoke' }, async ({ loginPage }) => {
  await loginPage.navigate();
  const admin = UserData.pickFor('admin-panel');

  await loginPage.usernameFieldLocator.fill(admin.email);
  await loginPage.passwordFieldLocator.fill(Env.adminPassword);
  await loginPage.submitSignInButtonLocator.click();

  await expect(loginPage.getPage()).toHaveURL(/dashboard/);
});
```

### Step 4 — add the page-ready identifier

Always set one locator per page as the page-ready identifier via `.setAsPageReadyIdentifier()`. `BasePage.navigate()` waits for it to be visible.

### Step 5 — run

```bash
npx playwright test tests/ui/<feature>/<journey>.spec.ts
```

For interactive debugging:

```bash
PWDEBUG=cli npx playwright test tests/ui/<feature>/<journey>.spec.ts
# then in another terminal:
playwright-cli attach tw-XXXX
```

---

## Reporting — Allure + execution logs

Every test run produces:

- a **Playwright HTML report** in `playwright-report/`,
- an **Allure report** in `allure-report/`,
- a **`execution-log` artifact** attached to every test via the logging fixture.

Generate and open the Allure report:

```bash
npm run test:report:allure
```

`playwright.config.ts` keeps `headless: false`, `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`. CI flips these as needed.

---

## Roadmap

Items the instruction layer (this README + `.claude/`) already references but the framework code has not yet implemented:

- **`createData` constraint object** + `pickFor()` for deterministic template selection.
- **`BaseApiClient.request<T>(method, path, opts)`** — real `APIRequestContext` integration with auth, zod parsing, and typed response.
- **`signIn(creds)` helper** on `BaseApiClient` for capturing and storing the auth token.
- **`EndpointMap`** in `src/api/endpoint.ts` keyed by logical name with `:param` templating.
- **Consolidated schema location** — currently zod schemas in `fixtures/schema.ts` are re-exported as types in `fixtures/api/types-guards.ts`. Consolidate.
- **`Env.getEnv` tolerance** — make non-CI runs tolerant of missing env so the seed test can run without a populated `.env`.
- **Working API example** in `tests/api/example/` that exercises the full path.

These are intentionally separated from the instruction layer. The instruction layer is correct today; the code work ships next.

---

## Contributing

1. Read `.claude/CLAUDE.md` first. It is the single source of truth for framework conventions.
2. Read `.claude/PLAN-ai-assisted-development.md` for the design rationale.
3. New page class → update the glossary and journey file first, then write the page class.
4. New test-data template → add it to `src/framework/test-data/schema/*.ts` with a constraints object.
5. New locator name → add it to `.claude/skills/business-context/glossary.md` first.
6. New journey → add it to `.claude/skills/business-context/journeys/<journey>.md` first.
7. Run `npm test` before opening a PR. All tests must be green.

Comments in code are for the next reader, not for the AI. Write comments that explain WHY a choice was made.

---

## License

MIT — see [LICENSE](LICENSE) (add your license file when you fork).

---

## Maintainer

Built by [2Bhanu](https://github.com/2Bhanu) — issues and PRs welcome.
