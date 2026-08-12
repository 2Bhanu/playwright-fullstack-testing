---
name: api-test-author
description: Interactive API test authoring for this Playwright framework. Load this skill when the user wants to author an API test (or a new API client method) by naming an API journey. The skill drives a multi-turn conversation: propose endpoint + schema, propose client method, propose the test outline, then implement. Endpoints must live in EndpointMap; request and response must be typed via zod.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npx playwright:*)
---

# API Test Author — Interactive

Use this skill when the user wants to author an API test or add a new
API client method. The session is **interactive** — you ask clarifying
questions, propose changes, get confirmation, then write code. For
non-interactive (spec-driven) generation, use the
`playwright-test-generator` agent instead.

This skill is loaded on demand. Always read `.claude/CLAUDE.md` first
to refresh the framework conventions, then load
`.claude/skills/business-context/` (or its template) for the app's
vocabulary.

---

## 0. Pre-requisite framework work

The API scaffolding in this repo is partial:

- `BaseApiClient` ([src/api/Clients/BaseApiClient.ts](../../src/api/Clients/BaseApiClient.ts))
  currently only stores headers. There is no `request(...)` method that
  hits the network through Playwright's `APIRequestContext`.
- `UserApi` ([src/api/Clients/UserManagementClient.ts](../../src/api/Clients/UserManagementClient.ts))
  is a stub that logs and echoes the payload — it does not actually
  call the API.
- The example API test file
  [tests/api/example/example-api.ts](../../tests/api/example/example-api.ts)
  is empty.

Before this skill is useful end-to-end, the framework needs:

1. A real `BaseApiClient.request<T>(method, path, opts)` that:
   - resolves `path` against `Env.<host>` + an entry in `EndpointMap`,
   - attaches `Authorization` if a token was set via
     `setAuthToken(...)`,
   - awaits `this.request.fetch(...)`,
   - parses the response body through a passed-in zod schema,
   - returns `{ status, body }` typed as `z.infer<Schema>`.

2. A `signIn(creds)` helper on `BaseApiClient` that captures and
   stores the auth token for subsequent requests.

3. An `EndpointMap` in `src/api/endpoint.ts` keyed by logical name
   (`Users.create`, `Users.get`, `Orders.cancel`, …). Client methods
   reference the map, never raw URLs.

4. Zod schemas for both **request** and **response** of every endpoint,
   in `src/framework/fixtures/schema.ts`.

5. A working example in `tests/api/example/example-api.ts` that
   exercises the full path (sign-in → call endpoint → zod parse →
   assertion).

Until those are in place, this skill can still propose the test
outline and the schema additions, but the implementation will not run.

---

## 1. Load context

1. Read `.claude/CLAUDE.md`. (Always — it carries the rules.)
2. Check for `.claude/skills/business-context/SKILL.md`. If present,
   read it AND `glossary.md`. For API work, focus on the entity
   glossary entries (e.g. `Order`, `Invoice`, `User`).
3. If `business-context/` does not exist:
   - Tell the user: "I need the business context for this app. Please
     copy `.claude/skills/business-context.template/` to
     `.claude/skills/business-context/`, populate `glossary.md` with
     at least the entities this API touches, and add a journey file
     under `journeys/`. I will wait."
   - **Do not proceed** until the entity is in the glossary.

---

## 2. Identify the journey

Ask the user:

- Which API journey? ("Create a user", "Fetch an order", "Cancel an
  invoice")
- Which endpoints does it touch? Method + path + expected response.
- Auth required? If yes, what credentials.
- Happy path only, or also negative paths? (e.g. 401 on bad creds,
  404 on missing resource, 422 on validation error)

---

## 3. Inspect existing client + schemas

Look at:

- `src/api/endpoint.ts` — is the endpoint already in `EndpointMap`?
- `src/api/Clients/` — is there a client class for the entity
  (`UserApi`, `OrderApi`, …)? Does it have the method?
- `src/framework/fixtures/schema.ts` — are there request and response
  zod schemas for the endpoint?

For each missing piece, propose adding it.

---

## 4. Propose the schema (zod)

Request schema:

```ts
export const CreateOrderRequestSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    sku: z.string(),
    quantity: z.number().int().positive(),
  })),
  notes: z.string().optional(),
});
```

Response schema:

```ts
export const OrderResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
  total: z.number(),
  createdAt: z.string(),
});
```

Both go in `src/framework/fixtures/schema.ts`. The schemas are the
**single source of truth** — types are derived via `z.infer`.

---

## 5. Propose the EndpointMap entry

```ts
// src/api/endpoint.ts
export const EndpointMap = {
  Orders: {
    create:  { method: 'POST',  path: '/orders' },
    get:     { method: 'GET',   path: '/orders/:id' },
    cancel:  { method: 'POST',  path: '/orders/:id/cancel' },
  },
  // ...
} as const;
```

The path is templated with `:param`. Client methods expand the
template with the supplied `pathParams`.

---

## 6. Propose the client method

```ts
// src/api/Clients/OrderApi.ts
export class OrderApi extends BaseApiClient {
  async create(
    payload: CreateOrderRequest
  ): Promise<ApiResponse<OrderResponse>> {
    return this.request<OrderResponse>({
      endpoint: EndpointMap.Orders.create,
      body: payload,
      responseSchema: OrderResponseSchema,
    });
  }
}
```

`BaseApiClient.request` resolves the endpoint, applies auth, fires the
fetch, parses the body through the response schema, and returns the
typed result.

---

## 7. Propose the test outline

The test is a **flat sequence** — no `test.step(...)` blocks in the
test file.

```ts
import { test, expect } from '@/framework/fixtures/fixture_aggregator';
import { OrderData } from '@/framework/test-data/schema/order';

test('Create an order as a returning customer', async ({ apiClientManager }) => {
  const orderApi = apiClientManager.get(OrderApi);
  const customer = OrderData.pickFor('returning-customer');

  const response = await orderApi.create({
    customerId: customer.id,
    items: customer.items,
  });

  expect(response.status).toBe(201);
  expect(response.body.status).toBe('PENDING');
  expect(response.body.total).toBe(customer.expectedTotal);
});
```

Notes:

- The aggregated fixture exposes `apiClientManager` — use it to obtain
  the right client.
- Test data comes from a schema (the same rule as UI tests).
- Assertions are at the top level — no `test.step` wrapping.

---

## 8. Implementation

Once the user confirms:

1. Add request and response zod schemas to
   `src/framework/fixtures/schema.ts` (and re-export via
   `z.infer`-derived types if needed — but prefer inferring at the
   call site).
2. Add the entry to `EndpointMap` in `src/api/endpoint.ts`.
3. Create or extend the client class at
   `src/api/Clients/<Entity>Api.ts`. The class extends
   `BaseApiClient`.
4. If a new test-data template is needed, add it to
   `src/framework/test-data/schema/<entity>.ts` with a constraints
   object.
5. Write the test file at `tests/api/<feature>/<journey>.spec.ts`.
6. Update `business-context/journeys/<journey>.md` if new or
   changed.

---

## 9. Verify

```bash
npx playwright test <path>
```

If the test fails:

- Check the response status and body in the Allure artifact (every
  test attaches a request/response log via the `test_log` fixture).
- Check the EndpointMap entry — most failures are a typo in the path
  or a missing `pathParams` entry.
- Check the zod schema — most parse failures are a missing optional
  field or a type mismatch.

---

## 10. Hand back

Summarize:

- New or edited zod schemas (file + names).
- New or edited `EndpointMap` entries.
- New or edited client methods.
- New or edited schema templates with constraints.
- New or edited test files.

---

## Conventions summary (do not skip)

- Test files import from `@/framework/fixtures/fixture_aggregator`.
- All zod schemas live in `src/framework/fixtures/schema.ts`.
- All endpoint paths live in `EndpointMap` in `src/api/endpoint.ts`.
- All client classes extend `BaseApiClient`.
- Request and response are both typed via zod.
- Tests are flat sequences — no `test.step` blocks in tests.
- Test data only via `SchemaData.pickFor(...)` or `generate(...)`.
- No inline literals for test data.
- Auth is set once via `await client.signIn(creds)` (or
  `setAuthToken(token)`) and reused automatically.
