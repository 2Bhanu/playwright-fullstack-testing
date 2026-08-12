# Journeys — TEMPLATE

Each journey file under this directory describes one user journey
end-to-end. The AI uses these as the structure for proposing tests:
file path, fixtures, test data template, and expected outcomes.

## Naming

`<kebab-case-journey-name>.md` — one file per journey.

## Structure

Every journey file has these sections, in this order:

1. **Header** — name, entry page(s), business goal.
2. **Test data** — which `SchemaData.pickFor(...)` to use.
3. **Steps** — the user-level steps in plain English, each with an
   `- expect:` bullet for the observable outcome.
4. **Negative paths** — at least one or two. ("Wrong password →
   expect error banner.")
5. **Glossary dependencies** — which glossary terms this journey
   touches. Add a "Glossary gap" line for any missing term.

## Header template

```md
# <Journey Name>

- Entry page: <PageName>
- Other pages: <PageName>, <PageName>
- Business goal: <one sentence>
- Priority: P0 | P1 | P2
- Test data: `<SchemaName>.pickFor('<lowercase token>')`
```

## Steps template

```md
## Steps

1. <User-level step>
   - expect: <observable outcome>
2. <Next step>
   - expect: <outcome>
3. <Next step>
```

User-level means the way a human would describe it. "Type the
username", not "fill the input". "Click Sign in", not "submit the
form".

## Negative paths template

```md
## Negative paths

- <Wrong input or wrong state>
  - expect: <error or alternative outcome>
- <Another wrong state>
  - expect: <...>
```

## Glossary dependencies template

```md
## Glossary dependencies

- <term> — used in step N
- <term> — used in step N

## Glossary gaps

- `<new term>` — needs to be added to `glossary.md` (suggested
  locator: `<...>Locator`).
```

The AI must surface every "Glossary gap" line in its proposal so the
user can populate the glossary in one pass before any code is written.
