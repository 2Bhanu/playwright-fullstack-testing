# Glossary — TEMPLATE

Fill this table before authoring any tests. The **locator field name**
in column 2 is the property name the AI must use when it declares a
`SimplifiedLocator` field on a `BasePage` subclass. That name flows
into both the action log line and the `test.step` label, so it is the
user-visible description of every action.

## How to fill

| Business term         | Locator field name           | Selector strategy           | Notes |
|-----------------------|------------------------------|-----------------------------|-------|
| <term>                | <term>Locator                | <strategy>                  | <notes> |

Examples of selector strategies:

- `role('textbox', { name: 'Username' })` — Playwright role locator.
- `role('button', { name: 'Sign in' })` — Playwright role locator.
- `label('Email')` — `<label>`-bound input.
- `placeholder('Search')` — placeholder text.
- `testId('submit-button')` — `data-testid`.
- `locator('[data-cy=submit]')` — custom attribute.

## Group by surface

It helps to group terms by the page (or surface) they live on:

### Login page

| Business term         | Locator field name           | Selector strategy           | Notes |
|-----------------------|------------------------------|-----------------------------|-------|
| username              | usernameFieldLocator         | role('textbox', { name: 'Username' }) | The textbox on the login form |
| password              | passwordFieldLocator         | role('textbox', { name: 'Password' }) | The textbox on the login form |
| submit sign-in        | submitSignInButtonLocator    | role('button', { name: 'Sign in' }) | Primary CTA on login form |

### Dashboard page

| Business term         | Locator field name           | Selector strategy           | Notes |
|-----------------------|------------------------------|-----------------------------|-------|
| account menu          | accountMenuLocator           | role('button', { name: 'Account' }) | Top-right dropdown trigger |
| user table            | userTableLocator             | role('table')               | The main listing; also the page-ready identifier |
| search users          | searchUsersFieldLocator      | role('searchbox')           | The toolbar search input |

### Order detail page

| Business term         | Locator field name           | Selector strategy           | Notes |
|-----------------------|------------------------------|-----------------------------|-------|
| order header          | orderHeaderLocator           | role('heading', { name: /Order #/ }) | Also the page-ready identifier |
| cancel order          | cancelOrderButtonLocator     | role('button', { name: 'Cancel order' }) | |
| total                 | totalLocator                 | testId('order-total')       | |

---

## Rules

- The locator field name in column 2 is what the AI writes in code.
- The name must be unique across the page class. If two elements share
  a business term, disambiguate by surface (e.g.
  `orderHeaderLocator` vs `invoiceHeaderLocator`).
- Suffix all locator names with `Locator`. Use `*FieldLocator` for
  inputs and `*ButtonLocator` for buttons when the term alone is
  ambiguous.
- If a term has no obvious English business name, use the closest one
  and add a note explaining the choice.
- Update this file before adding the locator to a page class.
