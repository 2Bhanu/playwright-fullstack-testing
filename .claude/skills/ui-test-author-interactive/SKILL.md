---
name: ui-test-author-interactive
description: Interactive UI test authoring for this Playwright framework. Load this skill when the user wants to author a UI test (or page class) by narrating a business journey. The skill drives a multi-turn conversation: propose page changes, propose test data, propose the test outline, then implement. Never invent page-level helper methods that the user has not asked for.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npx playwright:*)
---

# UI Test Author — Interactive

Use this skill when the user says "write a test for …" or names a UI
business journey. The session is **interactive** — you ask clarifying
questions, propose changes, get confirmation, then write code. For
non-interactive (spec-driven) generation, use the
`playwright-test-generator` agent instead.

This skill is loaded on demand. Always read `.claude/CLAUDE.md` first
to refresh the framework conventions, then load
`.claude/skills/business-context/` (or its template) for the app's
vocabulary.

---

## 1. Load context

1. Read `.claude/CLAUDE.md`. (Always — it carries the rules.)
2. Check for `.claude/skills/business-context/SKILL.md`. If present,
   read it AND `glossary.md` AND every file under `journeys/`.
3. If `business-context/` does not exist:
   - Tell the user: "I need the business context for this app. Please
     copy `.claude/skills/business-context.template/` to
     `.claude/skills/business-context/`, populate `glossary.md` with
     at least the terms needed for this journey, and add a journey
     file under `journeys/`. I will wait."
   - **Do not proceed** with test authoring until the glossary has
     the term and at least one journey is documented.

---

## 2. Identify the journey

Ask the user:

- Which user journey? ("Sign in", "Place an order", "Reset password",
  …)
- Which pages does it touch? If the user is unsure, propose a list
  from `journeys/*.md`.
- Happy path only, or also negative paths? ("Login with wrong
  password", "Login with disabled account")

If the journey does not exist yet, propose adding a new journey file
under `business-context/journeys/<journey>.md` and ask the user to
confirm before continuing.

---

## 3. Inspect existing page classes

For every page the journey touches, look under
`src/framework/pages/`. Read the relevant `BasePage` subclass and
enumerate its `SimplifiedLocator` fields. Compare against the glossary:

- Each glossary term mentioned in the journey must map to an existing
  locator field, OR be flagged as a new field to add.
- Each page must have exactly one `.setAsPageReadyIdentifier()` call.

If a page class is missing entirely, propose creating it (see §6).

---

## 4. Propose page-class changes (if any)

Show the user:

- New `BasePage` subclass (full file, with all locator fields and one
  page-ready identifier).
- OR edits to an existing page class — diff-style, just the changed
  lines.

Re-emphasize: **the field name is what shows up in the log and the
report**. Each name must come from `business-context/glossary.md`. If a
new term is needed, add it to the glossary first.

**Do NOT propose page-level helper methods** (e.g.
`loginPage.signInAs(...)`). Those are created by the user when they
recognize a repeated multi-step pattern. The AI only USES existing
helpers.

Wait for user confirmation before writing any code.

---

## 5. Propose the test data

For each piece of test data the test will need:

- Identify the relevant schema file under
  `src/framework/test-data/schema/`.
- Show the user which template `SchemaData.pickFor('<token from test
  name>')` would return.
- If no template matches, propose adding a new template with a
  constraints object.

Show the resolved values to the user before writing the test.

---

## 6. Propose the test outline

Show the user the test as a **flat sequence** of locator calls and
existing page-level helpers. **No `test.step(...)` blocks inside the
test** — the framework wraps every action in `test.step` at the page
class level.

```ts
test('Sign in as admin and open the user management panel', async ({ loginPage, dashboardPage }) => {
  await loginPage.navigate();

  await loginPage.usernameFieldLocator.fill(adminUser.email);
  await loginPage.passwordFieldLocator.fill(adminUser.password);
  await loginPage.submitSignInButtonLocator.click();

  await dashboardPage.userTableLocator.expectedToBeVisible();
});
```

Note:

- `testLogging` is auto-on. No manual log calls in the test.
- `loginPage.navigate()` runs the page-ready identifier check.
- The framework emits a `test.step` for every locator action.

Wait for user confirmation before writing the test file.

---

## 7. Implementation

Once the user confirms:

1. Create or edit the page class at
   `src/framework/pages/<area>/<PageName>.ts`.
2. If a new page class, register it in
   `src/framework/fixtures/pageFixture.ts` so the aggregated fixture
   exposes it. Update `fixture_aggregator.ts` if it does not already
   merge in the page fixture.
3. If a new test-data template, edit
   `src/framework/test-data/schema/<entity>.ts` with the constraints
   object.
4. Write the test file at `tests/ui/<feature>/<journey>.spec.ts`.
5. Update `business-context/journeys/<journey>.md` if the journey is
   new or if any step changed.

---

## 8. Verify

```bash
npx playwright test <path>
```

If the test fails:

- Diagnose at the framework level (see `.claude/CLAUDE.md` rules).
- Fix the page class or schema first; the test only changes if the
  fix requires it.
- Re-run.

For interactive debugging, attach via `playwright-cli`:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test <path> --debug=cli &
playwright-cli attach tw-XXXX
```

Then step through and observe.

---

## 9. Hand back

Summarize:

- What page class(es) were created or edited.
- What schema file(s) were touched.
- What test file(s) were added.
- The Allure tag for the test (`@smoke`, `@regression`, `@wip`).
- The journey file(s) updated.

---

## Conventions summary (do not skip)

- Test files import from `@/framework/fixtures/fixture_aggregator`.
- Locator field names come from `business-context/glossary.md`.
- One locator per page is the page-ready identifier.
- Tests are flat sequences — no `test.step` blocks in tests.
- No page-level helpers invented by the AI.
- Test data only via `SchemaData.pickFor(...)` or `generate(...)`.
- No inline literals for test data.
- No raw `await page.goto(...)` — use `await <page>.navigate()`.
