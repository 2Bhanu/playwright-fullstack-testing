# AI-Assisted Development Plan for the Playwright Framework

This plan covers the design of AI instructions (CLAUDE.md, skills, agents) for a
generic Playwright framework that supports **UI** and **API** tests, with the
goal of enabling **business-level end-to-end authoring** by an AI agent.

## What I found in the codebase

### Framework state (current)

- **UI is largely done**: [src/framework/pages/base/basepage.ts](src/framework/pages/base/basepage.ts)
  extends a `BasePage` that wraps the page in a `Proxy` which auto-stamps the
  **property name** of any `SimplifiedLocator` on first read. That property
  name then flows into:
  - the action log line emitted by `logger.info` via
    `logAction('Clicked {locatorName}')` (see
    [simplified_locator.ts:487-503](src/framework/core/simplified_locator.ts#L487-L503))
  - the `test.step(stepName, …)` wrapper that produces the test report label

  Therefore **the locator field name IS the log statement IS the test step**.
  That makes the naming of the property the single highest-leverage decision
  the AI makes when authoring a page class.

- **Simplified locator surface**: `SimplifiedLocator` wraps Playwright with
  role/label/textbox/placeholder/testId helpers and a chained
  `.first()/.nth()/.filter()/.and()/.or()` API. It also exposes
  `setAsPageReadyIdentifier()` which registers a locator on the owning page so
  `BasePage.navigate()` can assert the page has loaded.
  See [simplified_locator.ts](src/framework/core/simplified_locator.ts).

- **Fixtures are split and merged**: `mergeTests(pageTest, apiTest, loggingTest)`
  in [fixture_aggregator.ts](src/framework/fixtures/fixture_aggregator.ts).
  Each piece lives in `src/framework/fixtures/*` so AI can extend any one
  without touching the others.

- **Logging is wired through `AsyncLocalStorage`** in
  [test_logging_context.ts](src/framework/logging/test_logging_context.ts).
  The `test_log` fixture attaches the collected log as a Playwright artifact
  named `execution-log` (text/plain) on every test, via
  [log_fixture.ts](src/framework/fixtures/log_fixture.ts).

- **Test data uses zod + templates**: `createData(schema, templates)` produces
  `{ schema, templates, generate(templateName, overrides?) }`. The schema is
  parsed/validated, templates seed defaults, deepMerge layers overrides.
  See [createData.ts](src/framework/test-data/createData.ts),
  [deepMerge.ts](src/framework/test-data/deepMerge.ts),
  [schema/user.ts](src/framework/test-data/schema/user.ts).

  There is **no constraint object yet** that tells the AI which template fits
  which scenario. That has to be added.

- **API scaffolding is partial**: `ApiClientManager` exists in
  [src/api/Clients/ApiClientManager.ts](src/api/Clients/ApiClientManager.ts)
  and `BaseApiClient` ([BaseApiClient.ts](src/api/Clients/BaseApiClient.ts))
  carries headers + auth token. `UserApi` in
  [UserManagementClient.ts](src/api/Clients/UserManagementClient.ts) is a
  stub that logs and echoes — it does not actually hit a network. The
  example [tests/api/example/example-api.ts](tests/api/example/example-api.ts)
  is empty.

- **API zod schemas live in
  [src/framework/fixtures/schema.ts](src/framework/fixtures/schema.ts)** but
  are re-exported in
  [types-guards.ts](src/framework/fixtures/api/types-guards.ts) under
  `User`, `ErrorResponse`, `ArticleResponse`. These two files duplicate the
  schemas — one as runtime zod objects, the other as types. The split is
  awkward and the AI will trip on it.

- **CLAUDE.md is empty** (`.claude/CLAUDE.md` is a 0-byte file). Three default
  Playwright agents exist under `.claude/agents/` (`playwright-test-generator`,
  `…-healer`, `…-planner`) — they are stock generators that use `playwright-cli`
  and the MCP server. They are not aware of the framework's wrapper API.

- **Spec / plan folder is empty**: `specs/README.md` is just a one-line
  placeholder. Nothing else is there.

- **No business-context layer**: nothing exists to tell the AI what the app
  is, what journeys matter, what data shapes flow through it.

### Gaps the AI will hit immediately

| Gap | Symptom | Fix area |
|---|---|---|
| `user.ts` test-data has no constraint object | AI has no way to pick the right template for a given scenario | Add constraint schema to `createData` |
| API `UserApi` is a stub | Any API test the AI writes will pass trivially and not exercise real flow | Wire `BaseApiClient` to Playwright's `APIRequestContext` and document the pattern |
| Two parallel schema locations (zod in `fixtures/schema.ts`, types in `fixtures/api/types-guards.ts`) | AI will import the wrong one | Consolidate into one source of truth |
| No `navigation()`-style helper on the API layer | AI will hard-code URLs in tests | Add `BaseApiClient.request(...)` that resolves endpoint + baseURL + auth and parses against a zod schema |
| No fluent domain action on page classes (`login()`, `submitOrder()`, etc.) | AI will inline raw locator calls into tests, defeating the wrapping logging | Already partially done in `LoginPage.login()` — codify as a convention |
| Stock `playwright-test-generator` agent writes raw `page.click(...)` calls | Generated tests bypass the framework | Customize the agent to import from `@/framework/fixtures/fixture_aggregator` and use `SimplifiedLocator` |
| Stock `playwright-test-healer` agent will try to fix Playwright code it didn't write | Healing stays blind to the framework | Same — point it at the framework, ask it to re-emit business statements in test.step names |
| Stock `playwright-test-planner` agent writes `specs/*.plan.md` independent of the framework | Plans don't reference business-context or test-data schemas | Customize so plan output references both |
| No `business-context` skill | AI has to guess domain terms, journey names, locator semantics | New skill (template) |
| `Env` in [env.ts](src/config/env.ts) throws on missing keys at import time | AI cannot run the seed test without a populated `.env` | Make `getEnv` tolerant and degrade to placeholder values in non-CI |
| No example of an API test using the framework | AI has no template to copy from | Create a non-trivial API example exercising auth + zod parse |
| `loginpage.ts` locator names do not match business wording exactly | This is the rule the user explicitly called out — names must read as business terms | Reinforce via CLAUDE.md + UI skill |
| No `routes/` for API endpoints | Endpoints are hardcoded in client classes | Add an `EndpointMap` so clients and AI both reference one place |

---

## Proposed structure

```
.claude/
├── CLAUDE.md                              ← master instruction (always loaded)
├── agents/
│   ├── playwright-test-generator.md       ← MODIFIED (framework-aware)
│   ├── playwright-test-healer.md          ← MODIFIED (framework-aware)
│   └── playwright-test-planner.md         ← MODIFIED (framework-aware)
└── skills/
    ├── playwright-cli/                    ← unchanged (Microsoft stock)
    ├── ui-test-author-interactive/        ← NEW (interactive authoring)
    ├── api-test-author/                   ← NEW (interactive API authoring)
    └── business-context/                  ← NEW (template + how-to-clone)
```

Rationale (from the answers):

- **Two skills for the modes**, not one — interactive is the primary path
  (`ui-test-author-interactive` + `api-test-author`). Non-interactive lives
  in the customized generator agent and is gated to "best-effort" only.
- **Business context is its own skill**, cloned per-app. CLAUDE.md points at
  the skill so the AI knows to load it when authoring tests.
- **Locator naming rules live in CLAUDE.md** as a top-level rule and are
  repeated in the UI skill — same rule, two reach points.

---

## CLAUDE.md (top-level instruction)

Goal: a single file that always lands in the AI's context, with enough to
make safe framework-level decisions without loading any skill.

### Sections

1. **Framework overview** (4-6 lines)
   - Playwright + TypeScript, UI & API in one repo.
   - Test directory: `tests/ui/...`, `tests/api/...`.
   - Tests must import from `@/framework/fixtures/fixture_aggregator` (gives
     them `test`, `expect`, the page fixtures, the API client manager, and
     the logging context in one line).
   - Specs go in `specs/*.plan.md`.

2. **Locators are property-named — that name is the log statement**
   - The `BasePage` Proxy stamps every read of a `SimplifiedLocator` with the
     field name. The name flows into both the action log line (`Clicked
     <name>`) and the `test.step` label.
   - Therefore: **name the field after the business term the user would use**,
     not after the DOM. `usernameLocator`, not `input1Locator`. `submitOrderButtonLocator`,
     not `btnPrimaryLocator`. When a locator describes an input, prefer
     `usernameFieldLocator` / `passwordFieldLocator` so the log reads
     `Filled usernameFieldLocator with "..."`.
   - Chained locators inherit the property name; renaming via aliasing is a
     no-op (`first-name-wins`). So pick the name once, on the field.
   - Always set one locator per page as the page-ready identifier via
     `.setAsPageReadyIdentifier()` — usually the most prominent element on
     the page (a heading or the primary form).

3. **Tests are locator calls + page-level helpers, NOT test.step blocks**
   - The framework wraps every action in `test.step` at the **page-class
     level** (in `SimplifiedLocator.logAction`). Tests stay flat: a
     sequence of locator actions and page-level helper calls in plain
     order. The `test.step` names you see in the report come from the
     framework wrappers — `await this.usernameFieldLocator.fill(...)`
     emits a step called `Filled usernameFieldLocator with "..."`.
   - Tests MAY use locator calls directly. They are not forbidden. The
     rule is: locator calls are atomic; the test reads as a flat
     sequence of business actions.
   - Page-level helper methods (`loginPage.signInAs(...)`) exist **only
     for repeated multi-step patterns** (the same 2-3+ actions
     appearing across multiple tests). The AI does NOT proactively
     create such helpers; the user does, after recognizing a pattern.
     The AI MAY call existing helpers.

4. **Test data only from schema files**
   - **Never** inline string literals for test data in tests. Every piece of
     test data must come from `src/framework/test-data/schema/*.ts` via
     `createData(...)` and its `.generate(templateName, overrides?)`.
   - When defining a new schema, also define a **constraints object** so the
     AI can pick the right template without guessing. See
     "Test-data schema with constraints" below for the shape.
   - Tests may only receive data via fixtures OR via `schema.generate(...)`
     at the top of the test. No inline `const name = 'John Doe'`.

5. **Logs auto-attach as artifacts**
   - The logging fixture is auto-on. Do not duplicate log calls in tests.

6. **Two authoring modes**
   - **Interactive** (default): the user narrates the journey. The AI asks
     clarifying questions, proposes a page class, then proposes a test, then
     implements. Triggered by `/ui-test-author-interactive` or
     `/api-test-author`.
   - **Non-interactive**: invoked by `playwright-test-generator` agent when
     given a self-contained spec. Not preferred — used only when the spec is
     exhaustive.

7. **Business context**
   - Always load the relevant `business-context` skill before authoring a
     test for a domain. The skill carries the glossary, the journey list,
     the locator-naming convention per surface, and links to the matching
     schema files.

8. **What NOT to do**
   - Do not import directly from `@playwright/test` in tests — use the
     aggregated fixture.
   - Do not put raw `page.locator(...)` calls in test files.
   - Do not put business data (names, emails, orders) in test files.
   - Do not skip the page-ready identifier.
   - Do not call `await page.goto(...)` directly — use `BasePage.navigate()`.

---

## Test-data schema with constraints (framework change)

Current [createData.ts](src/framework/test-data/createData.ts) returns
`{ schema, templates, generate(...) }`. Extend the return to add a
**constraints map** keyed by template name:

```ts
// src/framework/test-data/schema/user.ts
export const UserData = createData(
  z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["USER", "ADMIN"]),
    active: z.boolean(),
  }),
  {
    activeUser: { name: "John Doe", email: "john@test.com", role: "USER", active: true },
    adminUser: { name: "Admin User", email: "admin@test.com", role: "ADMIN", active: true },
    inactiveUser: { name: "Inactive User", email: "inactive@test.com", role: "USER", active: false },
  },
  {
    // Constraint per template. The AI reads these to choose.
    activeUser:   { when: "default happy-path user",              requiredFor: ["login", "browse", "purchase"] },
    adminUser:    { when: "scenario needs elevated permissions",   requiredFor: ["admin-panel", "user-management"] },
    inactiveUser: { when: "scenario asserts disabled-account state", requiredFor: ["account-deactivation", "login-blocked"] },
  }
);
```

The `createData` return type becomes:

```ts
return {
  schema,
  templates,
  constraints,                        // NEW — same keys as templates
  generate(template, overrides?): T,
  pickFor(intent: string): T,         // NEW — returns the template whose `requiredFor` matches
};
```

`pickFor(intent)` does a substring / case-insensitive match of `intent`
against `requiredFor[*]`. It throws if zero or more than one match.

This gives the AI a deterministic answer when it sees a test like "Sign in
as an admin and verify the panel" → it calls `UserData.pickFor('admin-panel')`.

### Constraints object contract (doc'd in CLAUDE.md)

```ts
type TemplateConstraint = {
  /** Free-text description of WHEN this template is the right choice. */
  when: string;
  /** Lowercase tokens that the AI test description usually contains. */
  requiredFor: string[];
  /** Optional: explicitly exclude scenarios. */
  notFor?: string[];
};
```

The AI is instructed: **always pass `pickFor(<lowercase tokens from the test
name>)`** — never call `.generate()` with a hard-coded template name unless
the test name explicitly names that template.

---

## UI skill: `ui-test-author-interactive` (NEW)

Goal: a single skill that drives an interactive session in which the AI
collaborates with the user to author a UI test end-to-end.

### Frontmatter

```yaml
---
name: ui-test-author-interactive
description: Author a UI Playwright test interactively. Use when the user says "write a test for …" or names a business journey. Loads business-context automatically.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npx playwright:*)
---
```

### Flow

1. **Discover business context**
   - Look for `.claude/skills/business-context/SKILL.md`. If present, read it
     and load its glossary and journey list.
   - If absent, ask the user for: app name, primary journeys, glossary.

2. **Identify the surface**
   - Ask: which page(s) does this journey touch? If the user does not know,
     propose a list from the business-context journey map.

3. **Inspect existing page classes**
   - Grep `src/framework/pages/**` for relevant page classes. If the page
     exists, read it. If a locator is missing, the AI proposes a new field
     on the page class — never on the test.

4. **Propose the page change**
   - Show the new field declarations (or new page class) and ask for
     confirmation.
   - Re-emphasize: the **field name** is what shows up in logs and test
     steps. Pick it from the business-context glossary.

5. **Propose the test outline**
   - Show the test body as a **flat sequence** of locator calls and
     existing page-level helpers. **No `test.step(...)` inside the test
     file** — the framework wraps each action in its own step at the
     page-class level. Do not invent new page-level helpers; call
     existing ones or inline the locator calls.

6. **Pick test data**
   - For every data field, call `Schema.pickFor('<intent from step>')`.
   - Show the resolved values to the user before writing the test.

7. **Write the test, the page change, and any new schema in one pass**
   - Test path: `tests/ui/<feature>/<journey>.spec.ts`.
   - Page class: extend `BasePage`.
   - Schema file: add new entries to `src/framework/test-data/schema/*.ts`
     with constraints.

8. **Run the test in debug, attach via playwright-cli, verify**
   - `npx playwright test <path> --debug=cli` in the background.
   - `playwright-cli attach tw-XXXX` → `resume` → step through.

9. **Hand back**
   - Summarize: what page class changed, what schema file changed, what test
     was added, and the logs (auto-attached).

---

## API skill: `api-test-author` (NEW)

Goal: a sister skill for API authoring. Mirrors the UI skill's structure.

### Frontmatter

```yaml
---
name: api-test-author
description: Author an API Playwright test interactively. Use when the user names an API journey ("create order", "fetch invoice"). Loads business-context automatically.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npx playwright:*)
---
```

### Pre-requisite framework work (the API gap)

Before the skill is useful the framework has to provide a real API layer:

- **`BaseApiClient` becomes real**: `request<T>(method, path, { body?, query?, headers? })`
  resolves `path` against a base URL from `Env`, attaches `Authorization`
  from the set token, awaits `this.request.fetch(...)`, parses the body
  through a passed-in zod schema, and returns `{ status, body }` typed as
  `z.infer<Schema>`.
- **`EndpointMap`** in `src/api/endpoint.ts`: one source of truth for
  endpoint paths (`/users`, `/orders/:id`, …). Client methods take an
  `endpoint` constant and a `pathParams` object, never a raw string.
- **Auth helper**: `await apiClient.signIn(creds)` stores the token on the
  client so subsequent requests are authenticated.
- **A real `UserApi` example** that uses `BaseApiClient.request(...)`,
  parses against `UserSchema`, and exposes methods like `create`, `get`,
  `update`, `delete`.

The API skill instructs the AI to **only add endpoints via `EndpointMap`,
only via a client class that extends `BaseApiClient`, and only with a zod
schema for both request and response**.

### Flow

1. **Discover business context** (same as UI skill).
2. **Identify the endpoint(s)** — reference `EndpointMap`; if missing, ask
   the user for the route + method.
3. **Pick the response schema** — must already exist in
   `src/framework/fixtures/schema.ts` (or be added there).
4. **Propose a client method** — `async createOrder(req: CreateOrderRequest)`
   that returns `Promise<ApiResponse<OrderResponse>>`.
5. **Propose a test** — a `test.step('…', async () => { const r = await
   apiClient.user().create(...); expect(r.status).toBe(201); expect(r.body).toMatchSchema(OrderResponseSchema); })`.
6. **Verify**: run with `npx playwright test <path>`.

---

## Business-context skill (NEW — template + how to clone)

Goal: a **template** skill that any team can clone for their app. It carries:

- Glossary (business terms → locator property names).
- Journey map (user journeys → matching page classes + test data templates).
- Per-surface locator-naming conventions.
- Links to the relevant zod schemas.

### Layout

```
.claude/skills/business-context/
├── SKILL.md              ← template, cloned per-app
├── glossary.md           ← cloned per-app
└── journeys/
    ├── README.md         ← how journeys are described
    └── example-journey.md← cloned per-app
```

### `SKILL.md` (template)

```yaml
---
name: business-context
description: Business context for <APP_NAME>. Loaded automatically by ui-test-author-interactive and api-test-author. Edit glossary.md and journeys/ before authoring tests.
---
```

Body sections:
1. **App identity** (1 paragraph)
2. **Glossary** — link to `glossary.md`. Rule: the term in the glossary is
   the term the AI uses for locator field names.
3. **Journeys** — link to `journeys/`. Each journey file lists:
   - name
   - entry page (which `BasePage`)
   - happy-path steps in business language
   - test-data template (which `SchemaData.pickFor(...)` to use)
4. **Locator naming convention** — per surface (form vs list vs detail),
   how to derive the field name from the business term.

### `glossary.md` template

```md
# Glossary — <APP_NAME>

| Business term         | Locator field name           | Notes |
|-----------------------|------------------------------|-------|
| username              | usernameFieldLocator         | The textbox on the login form |
| password              | passwordFieldLocator         | The textbox on the login form |
| submit sign-in        | submitSignInButtonLocator    | Primary CTA on login form     |
| account menu          | accountMenuLocator           | Top-right dropdown trigger   |
```

The AI is instructed: **the locator field name IS the second column**. Do
not paraphrase.

### `journeys/example-journey.md` template

```md
# Sign In journey

- Entry page: `LoginPage`
- Business goal: authenticate the user and land them on the dashboard.
- Test data: `UserData.pickFor('login')` → returns `activeUser` template
  unless the test name says "admin", in which case `pickFor('admin-panel')`.

## Steps

1. Open the login page.
2. Enter <username>.
3. Enter <password>.
4. Submit.
5. Land on the dashboard.

## Negative paths

- Wrong password → expect error banner.
- Disabled account → expect account-disabled page.
```

### How to clone

CLAUDE.md says: "Before authoring a test, ensure `.claude/skills/business-context/`
exists. If it does not, copy the template from
`.claude/skills/business-context.template/`, rename to `business-context/`, and
populate glossary + journeys. Do not proceed with test authoring until
glossary + at least one journey are filled in."

---

## Stock agents — modifications

All three stock agents need to be customized so they know about the
framework. The customization pattern is the same:

- Add a "Framework awareness" preamble that points to CLAUDE.md and the
  relevant skills.
- Restrict the agent to import from the framework (`@/framework/...`).
- Forbid raw `page.locator(...)` in output.
- Require page-level helpers in tests.
- Require schema-driven test data.

### `playwright-test-generator.md` (modified)

Add (after the existing system prompt):

```md
## Framework awareness

This project wraps Playwright in a typed framework. All generated tests
MUST:

- Import `test, expect` from `@/framework/fixtures/fixture_aggregator`.
- Use the page fixtures exposed there (e.g. `loginPage`).
- Call only page-level helper methods on those fixtures (e.g.
  `loginPage.signInAs(...)`). Do not write raw locator chains in tests.
- Use `await test.step('<business statement>', …)` wrappers.
- Source test data from `src/framework/test-data/schema/*.ts`. Inline
  literals are forbidden.
- Set one locator per new page as the page-ready identifier via
  `.setAsPageReadyIdentifier()`.
- Name every locator field after the matching business term in
  `.claude/skills/business-context/glossary.md`. The field name is what
  shows up in logs and test step labels — pick it carefully.

When the plan requires a page that does not exist, extend
`src/framework/pages/...` with a `BasePage` subclass and put the new
locators on it. Never add locators to the test file.

For non-interactive runs: produce only the test file. Skip the
clarification step. Warn the user that interactive mode is preferred and
that this output may need human review.

When in doubt about which template to use, call
`SchemaData.pickFor('<lowercase token from test name>')` — never hard-code
a template name unless the test name explicitly names it.
```

### `playwright-test-healer.md` (modified)

Add:

```md
## Framework awareness

When fixing a test, prefer changes that re-align the test with the
framework rather than workarounds:

- If a locator is brittle, fix the page class — not the test. Add or
  rename the locator field on the relevant `BasePage` subclass.
- If test data is inline, move it into `src/framework/test-data/schema/`
  with a constraints object.
- If the failure is in `BasePage.navigate()` because the page-ready
  identifier is wrong, fix the `.setAsPageReadyIdentifier()` call on the
  page class.
- If the failure is in business logic (assertion mismatch), ask the user
  to confirm whether the spec or the app changed. Do not silently flip
  the assertion.

Re-run via `npx playwright test <path>` after every fix.
```

### `playwright-test-planner.md` (modified)

Add:

```md
## Framework awareness

When writing a plan, also produce:

- For each scenario, the **business statement** that becomes the
  `test.step` label.
- For each scenario, the **page class(es)** the journey touches (must
  exist or be added under `src/framework/pages/...`).
- For each scenario, the **test data schema** (`SchemaData.pickFor(...)`)
  the test will use.
- For each new page class the plan implies, list the **locator field
  names** (drawn from the glossary in `.claude/skills/business-context/`).

The plan file should be saved under `specs/<feature>.plan.md` and use the
existing Playwright planner schema.
```

---

## What stays the same

- The `playwright-cli` skill remains untouched (it is the Microsoft stock one
  and works as-is).
- `BasePage` / `SimplifiedLocator` need no source changes for the UI part.
- The logging fixture stays auto-on.
- The `fixture_aggregator` stays the import surface for tests.

## Framework code changes that ARE required (to close the API gap and the
constraint gap before the skills are useful)

1. Extend `createData` to return `constraints` + `pickFor(intent)`.
2. Refactor `BaseApiClient` into a real `request<T>` that uses Playwright's
   `APIRequestContext`, attaches auth, parses through zod, returns typed.
3. Introduce `EndpointMap` in `src/api/endpoint.ts`.
4. Replace the `UserApi` stub with a real `UserApi` that uses
   `BaseApiClient.request(...)`.
5. Consolidate `fixtures/schema.ts` and `fixtures/api/types-guards.ts` into
   one source (the zod definitions stay; the re-exports of `User`,
   `ErrorResponse`, `ArticleResponse` go away — consumers import from the
   schema file).
6. Make `Env.getEnv` tolerant when `NODE_ENV !== 'production'` so AI can
   run a seed test without a populated `.env`. (Hard fail stays in CI.)
7. Add a non-trivial API example under `tests/api/example/` that exercises
   auth + zod parse + a happy-path test.
8. Add the **business-context template** skill under
   `.claude/skills/business-context.template/` so cloning is one copy.

These are the minimum code changes that unlock AI-driven authoring for both
UI and API. Everything else in the plan (CLAUDE.md, UI skill, API skill,
modified agents) is documentation that lives under `.claude/`.

---

## Order of work (recommended)

1. **Now (in this conversation)** — write `.claude/CLAUDE.md` and the
   three modified agent files. Optionally write the UI/API skill skeletons.
2. **Next sprint** — implement the framework code changes (constraint
   object, `BaseApiClient.request`, `EndpointMap`, real `UserApi`,
   consolidated schema, tolerant `Env`, API example).
3. **After** — clone the business-context template per app, populate
   glossary + journeys, start authoring tests.

---

## Files this plan will create or modify

### Create

- `.claude/CLAUDE.md` (currently 0 bytes — replace with full content)
- `.claude/skills/ui-test-author-interactive/SKILL.md`
- `.claude/skills/api-test-author/SKILL.md`
- `.claude/skills/business-context.template/SKILL.md`
- `.claude/skills/business-context.template/glossary.md`
- `.claude/skills/business-context.template/journeys/README.md`
- `.claude/skills/business-context.template/journeys/example-journey.md`

### Modify (agent files)

- `.claude/agents/playwright-test-generator.md` (append framework-awareness
  block; do not remove the stock prompt — they coexist)
- `.claude/agents/playwright-test-healer.md` (same)
- `.claude/agents/playwright-test-planner.md` (same)

### Out of scope for this plan (but documented as a follow-up)

- `BaseApiClient.request`, `EndpointMap`, real `UserApi`, `createData`
  constraint object, `Env` tolerance, API example, schema consolidation.

These need a separate workstream and approval before code is written.

---

## Decision summary

- **Modes**: two skills (`ui-test-author-interactive`, `api-test-author`)
  for interactive; stock `playwright-test-generator` agent customized for
  non-interactive. Interactive is the default and primary path.
- **Business context**: a **template skill** (`.claude/skills/business-context.template/`)
  that teams clone to `.claude/skills/business-context/` and populate.
  CLAUDE.md references it as the loading point.
- **Locator naming**: the rule lives in **CLAUDE.md** as a top-level
  instruction AND is repeated in the UI skill. The AI is told to load the
  UI skill whenever it is authoring a page class.

This is enough to ship the instruction layer today. The framework code
changes listed above are the next step to make the skills actually produce
passing tests.
