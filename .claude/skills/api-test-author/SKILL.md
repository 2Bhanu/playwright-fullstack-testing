# API test authoring

Load this skill only when authoring or editing:

- `tests/api/**/*.spec.ts`
- `src/api/**/*.ts`

**Do not load the `ui-test-author` skill unless the
"Cross-loading: UI verification" section at the end applies.**

---

## Endpoint paths

- **Never** hard-code endpoint paths in tests.
- Use the `EndpointMap` at `src/api/endpoint.ts` — logical name → path
  with `:param` templating.
- Add a new entry to the map before referencing it from a client.
- Reference by logical name on the client subclass.

---

## Request: `SimplifiedRequest` chain

Every endpoint on a `BaseApiClient` subclass is a `SimplifiedRequest`
instance bound to a base path. The chain mutates and returns `this`;
the terminal methods (`post`, `get`, `put`, `patch`, `delete`) issue
the call and return Playwright's raw `APIResponse`.

```ts
const response = await userClient.loginEndPoint
  .withAuth('bearer', token)
  .withPayload(myUser)
  .post();

expect(response.status()).toBe(201);
const body = await response.json();
expect(body.name).toBe(myUser.name);
```

Chain methods (all return `this`):

| Method | Purpose |
|---|---|
| `.withAuth('bearer' \| 'basic' \| 'apiKey', …)` | per-call auth override |
| `.withHeader(name, value)` / `.withHeaders({...})` | add request headers |
| `.withParam(name, value)` / `.withParams({...})` | add query params |
| `.withPayload(body)` | JSON body for POST / PUT / PATCH |
| `.relaxHTTPValidation()` | ignore HTTPS errors (self-signed certs) |

Terminal methods (return `Promise<APIResponse>`):

`post()`, `get()`, `put()`, `patch()`, `delete()`.

---

## Auth

Credentials are obtained from `AuthClient` and passed to `.withAuth(...)`.
The credential shape is inferred from the kind string — call sites carry
values only, not a tagged object.

| Kind | Signature | Example |
|---|---|---|
| `bearer` | `(kind: 'bearer', token: string)` | `.withAuth('bearer', token)` |
| `basic` | `(kind: 'basic', { username, password })` | `.withAuth('basic', { username, password })` |
| `apiKey` | `(kind: 'apiKey', key, headerName?)` | `.withAuth('apiKey', key)` / `.withAuth('apiKey', key, 'X-Custom-Key')` |

**Never** hard-code tokens, passwords, or API keys in tests or clients.

```ts
const token = await authClient.getBearerToken();
const basic = await authClient.getBasicAuth();
const apiKey = await authClient.getApiKey();
```

---

## Clients

`ApiClientManager.clients` registers every `BaseApiClient` subclass.
Each key becomes a fixture available on the test:

```ts
test('Create user', async ({ authClient, userClient }) => { ... });
```

The current registry (see `src/api/Clients/ApiClientManager.ts`):

| Fixture | Class |
|---|---|
| `authClient` | `AuthClient` |
| `userClient` | `UserClient` |
| `adminClient` | `AdminClient` |

`ApiClientManager` calls the class's static `setup(request)` before
construction and `cleanup(request)` after the test, if defined.

---

## Test data

Source of truth: `src/framework/test-data/createData.ts` (read it once).

Pick by template name, pass overrides for per-test variation:

```ts
import { UserData } from '@/framework/test-data/schema/user';

const myUser = UserData.generate('activeUser', { name: 'John Doe' });

const response = await userClient.loginEndPoint
  .withPayload(myUser)
  .post();
```

- Never inline literal entity data in tests.
- Add a new template to `src/framework/test-data/schema/<entity>.ts`
  before using it.
- Request and response bodies should both go through zod schemas.
  Schemas currently live near each client; consolidation is on the
  roadmap.

---

## Schemas

- Request payload shape = zod schema in `src/framework/test-data/schema/<entity>.ts`.
- Response body parsing = zod schema colocated with the client
  (today: scattered near `fixtures/`; consolidation is on the roadmap).
- A failing parse should surface as a clear test failure — never
  `as any` cast a parsed response.

---

## Logging

The `test_log` fixture is auto-on. **Do not** add manual
`logger.info('called POST /users')` calls — that duplicates the
framework's per-action log lines emitted by the locator Proxy
on the UI side. API calls currently have no per-action log
emission; do not invent logging on top of the framework without
asking.

---

## Cross-loading: UI verification

If an API test must verify state via the UI
(e.g. `POST /users`, then assert the user appears in the dashboard):

- Load `ui-test-author` **in the same session**.
- Use the registered page fixtures from the test destructuring
  — not raw `page.locator(...)`.
- Generate data via `createData`, post via the `SimplifiedRequest`
  chain, then switch to UI assertions via page fixtures.

For tests that only create data via the API and never assert in
the UI (pure API tests), do **not** load `ui-test-author`.
