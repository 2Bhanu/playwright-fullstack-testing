# UI test authoring

Load this skill only when authoring or editing:

- `tests/ui/**/*.spec.ts`
- `src/framework/pages/**/*.ts`

**Do not load this skill for `tests/api/**` work.**
**If the test also needs API-based data creation, also load `api-test-author`.**

---

## Page class

Every page lives at `src/framework/pages/<area>/<PageName>.ts` and extends `BasePage`.

```ts
export class LoginPage extends BasePage {
  endpoint: string = '/login';

  usernameFieldLocator =
    this.simplifiedLocator.textbox({ name: 'Username' })
      .setAsPageReadyIdentifier();

  passwordFieldLocator =
    this.simplifiedLocator.textbox({ name: 'Password' });

  submitSignInButtonLocator =
    this.simplifiedLocator.button({ name: 'Sign in' });
}
```

Rules:

- **One** locator per page must call `.setAsPageReadyIdentifier()` —
  `BasePage.navigate()` waits for it before returning.
- Field names end in `Locator` (the suffix is part of the auto-stamped
  log line and the `test.step` label).
- Prefer role-based locators (`textbox`, `button`, `link`, `heading`,
  `row`, `cell`, `dialog`, `tab`, `combobox`, `switch`, `alert`,
  `radio`, `checkbox`, `option`) over CSS / testId.
- Chain `.first()` / `.nth()` etc. — chained calls **inherit the
  property name** (first-name-wins). Renaming via aliasing is impossible.

---

## Test file

- Single import:
  `import { test, expect } from '@/framework/fixtures/fixture_aggregator'`
- **Flat sequence.** No `test.step(...)` inside the test — the page
  class wraps each locator action in a step automatically.
- `await page.goto(...)` — **NEVER**. Use `await <page>.navigate()`.
- For assertions on the underlying `Page`, use
  `expect(loginPage.getPage()).toHaveURL(...)`.
- For assertions on the framework's locators, use the **domain
  assertions** below — not raw `expect(locator)`.

---

## Domain assertions

Use these instead of raw `expect(...)`:

| Method | Purpose |
|---|---|
| `locator.expectedToBeVisible()` | visibility |
| `locator.expectedToBeEnabled()` | enabled state |
| `locator.expectedToBeChecked()` | checkbox / radio checked |
| `locator.expectTextToBe(text)` | exact text |
| `locator.expectValueToBe(value)` | input value |
| `locator.expectAttributeToBe(name, value)` | attribute value |
| `locator.expectCountToBe(n)` | count of matched elements |

---

## Test data

Source of truth: `src/framework/test-data/createData.ts` (read it once).

Pick by template name, pass overrides for per-test variation:

```ts
import { UserData } from '@/framework/test-data/schema/user';

const admin = UserData.generate('adminUser', { name: 'Test Admin' });
```

- Never inline literal user / entity data in tests.
- Add a new template to `src/framework/test-data/schema/<entity>.ts`
  before using it. Templates live next to the schema.
- `pickFor(intent)` is on the roadmap; today the AI chooses by name.

---

## Page-level helpers

Helpers on a `BasePage` subclass are **user decisions**, not AI decisions.

- If you see the same multi-step pattern repeating across tests and
  the user has **not** already factored it, **flag the repetition**
  in the hand-back and let the user decide.
- Do not invent `loginPage.signInAs(...)` on your own.
- When the user *does* ask for a helper, the framework wraps the
  helper's body in `test.step` blocks at the page-class level —
  the report shows each sub-step inside the helper automatically.

---

## Logging

The `test_log` fixture is auto-on. One log line per locator action is
emitted by the locator Proxy. **Do not** add manual
`logger.info('clicked login')` calls in tests — that duplicates
the framework's output.

---

## Cross-loading: API for test data

If a UI test must create state via the API before asserting
(e.g. seed a user via `POST`, then verify in the dashboard):

- Load `api-test-author` **in the same session**.
- Obtain API client fixtures from the test destructuring:
  `async ({ userClient, authClient }) => { ... }`.
- Use the `SimplifiedRequest` chain (`.withAuth().withPayload().post()`).
- Generate the payload via `UserData.generate('activeUser', { ... })`
  — same source of truth as the UI side.
- Then return to UI assertions via the page fixtures.

Never inline a literal API payload in a UI test.
