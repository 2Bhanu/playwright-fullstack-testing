---
name: business-context.template
description: TEMPLATE — clone this directory to `.claude/skills/business-context/` and populate `glossary.md` and `journeys/*.md` for the target app. This file exists only as a starting point; it is not loaded as a skill itself.
---

# Business Context Template

This is a **template** — it is not the active business context for any
specific app. The active business context for an app lives at
`.claude/skills/business-context/`. Clone this directory to that path
and populate it before authoring tests.

---

## Why this exists

The framework is generic. Without business context, the AI has to guess:

- what the app does,
- which journeys matter,
- what to call each locator and each field,
- which test-data template fits a given scenario.

This skill carries the answer to all four in one place. Loading it
turns the framework into an app-specific authoring environment.

---

## How to clone

From the repo root:

```bash
cp -r .claude/skills/business-context.template .claude/skills/business-context
```

Then edit:

- `SKILL.md` — change the frontmatter `name:` from
  `business-context.template` to `business-context`. Update the
  description to name the app.
- `glossary.md` — fill the table.
- `journeys/README.md` — keep, it documents the journey format.
- `journeys/example-journey.md` — replace with the first real journey,
  then add more.

The first time the AI loads `business-context/SKILL.md` it should
treat it as ground truth and refuse to author tests against
un-glossary'd terms.

---

## What lives here

| File | Purpose |
|---|---|
| `SKILL.md` | Frontmatter + summary. The AI loads this first. |
| `glossary.md` | Business term → locator field name. The single source of truth for naming. |
| `journeys/README.md` | How journey files are structured. |
| `journeys/<journey>.md` | One file per user journey. |

---

## How the AI uses this skill

When loaded, the AI:

1. Reads `SKILL.md` (this file).
2. Reads `glossary.md` and uses it as the authoritative mapping from
   business term to locator field name. If the test author asks for a
   locator whose name is not in the glossary, the AI proposes adding
   the term first.
3. Reads every file under `journeys/` to understand the journeys the
   app supports.
4. Uses the journey files as the structure for proposing tests (file
   path, fixtures, test data template).

If a journey file references a term not in the glossary, the AI
refuses to author that journey until the glossary is updated.

---

## Maintenance

- Every new locator field name MUST be added to `glossary.md` first.
- Every new user journey MUST be added under `journeys/` before tests
  for it are written.
- Stale glossary entries (locators that no longer exist) MUST be
  removed.
- Stale journeys MUST be moved to `journeys/_deprecated/` with a date
  stamp; do not delete them in case older tests still reference them.
