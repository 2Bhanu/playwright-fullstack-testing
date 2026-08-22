# Refactor `AuthHandler` → `AuthClient` + move header logic into `SimplifiedRequest`

## Goal

Simplify the API auth layer so:

1. The auth-handling code lives where it's used (`SimplifiedRequest`), not
   in a separate `AuthHandler` factory + apply module.
2. `AuthClient` becomes a normal `BaseApiClient` subclass — a sibling of
   `UserClient` and `AdminClient` — that owns the endpoints used to obtain
   credentials (token, basic creds, api key).
3. `withAuth(kind, credentials)` on `SimplifiedRequest` takes just two
   arguments: an `AuthType` string and the credentials struct that
   resolves from `AuthClient`.
4. `.withPayload(...)` chain stays — the `.posts(myUser)` in the original
   ask was a typo for `.post()`.

The current `AuthHandler.ts` file is deleted; it is replaced by
`AuthClient.ts` (a `BaseApiClient` subclass with stub auth endpoints).

---

## Final shape

### Usage in a test

```ts
test('Sign in and create a user', async ({ authClient, userClient }) => {

  // 1. Resolve credentials from the auth client.
  const token = await authClient.getBearerToken();
  // For basic:  const { username, password } = await authClient.getBasicAuth();
  // For apiKey: const { key, headerName }    = await authClient.getApiKey();

  // 2. Call the endpoint with auth applied.
  await userClient.loginEndPoint
    .withAuth('bearer', token)
    .withPayload(myUser)
    .post();
});
```

`AuthClient` is wired through the same `ApiClientManager` + fixture path
as `UserClient` / `AdminClient`, so the test destructures it from the
fixture bag like any other client.

---

## File-by-file changes

### 1. Delete `src/api/Clients/AuthHandler.ts`

Reason: its three concerns — the `AuthSpec` type, the
`AuthHandler.bearer/basic/apiKey` factories, and the
`AuthHandler.apply(...)` projection — are all moving out.

### 2. New `src/api/Clients/AuthClient.ts`

A `BaseApiClient` subclass with three stub auth endpoints, each backed
by a `SimplifiedRequest`. The stub methods return hard-coded placeholders
so the request fires and produces an obvious 401 — visible signal that
real auth is not yet wired.

```ts
import { BaseApiClient } from './BaseApiClient';
import { SimplifiedRequest } from './SimplifiedRequest';

export class AuthClient extends BaseApiClient {

  readonly getBearerTokenEndPoint =
    new SimplifiedRequest(this.request, '/auth/token');

  readonly getBasicAuthEndPoint =
    new SimplifiedRequest(this.request, '/auth/basic');

  readonly getApiKeyEndPoint =
    new SimplifiedRequest(this.request, '/auth/api-key');

  /** Stub: returns a hard-coded placeholder bearer token. */
  async getBearerToken(): Promise<string> {
    // Real implementation will fire getBearerTokenEndPoint and parse.
    return 'PLACEHOLDER_BEARER_TOKEN';
  }

  /** Stub: returns a hard-coded placeholder basic-auth credential pair. */
  async getBasicAuth(): Promise<{
    username: string;
    password: string;
  }> {
    return {
      username: 'PLACEHOLDER_USERNAME',
      password: 'PLACEHOLDER_PASSWORD',
    };
  }

  /** Stub: returns a hard-coded placeholder api-key credential pair. */
  async getApiKey(): Promise<{
    key: string;
    headerName?: string;
  }> {
    return {
      key: 'PLACEHOLDER_API_KEY',
      headerName: 'X-API-Key',
    };
  }
}
```

Three endpoint fields are declared now so the wiring is complete when
real auth endpoints are added later; the stub methods bypass them.

### 3. Rewrite `src/api/Clients/SimplifiedRequest.ts`

Three things change:

a. **Drop the `AuthHandler` / `AuthSpec` import.** The auth state on
   the chain becomes just two fields: a kind tag and a credentials
   struct.

b. **New `withAuth` signature** — two args, no spec object:

```ts
export type AuthType = 'bearer' | 'basic' | 'apiKey';

export type AuthCredentials =
  | { kind: 'bearer'; token: string }
  | { kind: 'basic';  username: string; password: string }
  | { kind: 'apiKey'; key: string; headerName?: string };

withAuth(authType: AuthType, credentials: AuthCredentials): this {
  // The credentials argument is already structured (matches AuthCredentials
  // variants). Store both, type-narrowed at call site.
  this.authKind = authType;
  this.authCredentials = credentials;
  return this;
}
```

c. **Replace `resolveHeaders` with inline header construction** inside
`send(...)`. The bearer/basic/apiKey branches move from `AuthHandler.apply`
directly into `SimplifiedRequest.send`, so the file is self-contained.

The `payload` chain state and `.withPayload(...)` method are **unchanged**
— the user's `.posts(myUser)` is interpreted as a typo for `.post()`.

### 4. Update `src/api/Clients/ApiClientManager.ts`

Add `authClient: AuthClient` to the `clients` registry. The type-level
machinery (`ClientClass`, `ClientInstance`, `ApiClientFixtures`) picks up
the new entry automatically — no other edits needed.

```ts
import { AuthClient } from './AuthClient';
// ...

static readonly clients = {
  authClient: AuthClient,
  userClient: UserClient,
  adminClient: AdminClient,
} as const;
```

After this change, every test that uses the `test`/`expect` exported
from `@/framework/fixtures/fixture_aggregator` automatically gets
`authClient` as a fixture.

### 5. Update `tests/api/example/example-api.ts`

The three demo tests currently use `AuthHandler.bearer/basic/apiKey`.
Rewrite them to obtain credentials from `authClient`:

- `AuthHandler.bearer('test-token')` → `await authClient.getBearerToken()`
- `AuthHandler.basic('admin', 'secret')` → `await authClient.getBasicAuth()`
- `AuthHandler.apiKey('my-secret', 'X-API-Key')` → `await authClient.getApiKey()`

Destructure `authClient` from the fixture bag. The chain shape
`.withAuth(kind, credentials).withPayload(...).post()` is unchanged
except for the two-arg `withAuth`.

### 6. Update doc comments

`src/api/Clients/BaseApiClient.ts`, `UserClient.ts`, and any other
JSDoc comments that reference `AuthHandler.bearer(...)` get updated
to the new pattern. A single grep will catch them.

---

## Type-narrowing story

`withAuth(kind, credentials)` does NOT collapse to a single union at
chain time — the credentials arg is passed through as-is, and
`SimplifiedRequest.send` checks `this.authKind` and reads the matching
field off `this.authCredentials`. At the call site, TypeScript can still
help if `credentials` is constrained to a kind-tagged union; we will
ship that union shape so IDEs flag a `'bearer'` paired with a basic
struct.

If the user wants strict runtime validation later (e.g. zod-parsed
credentials), that can be layered on top without changing the chain.

---

## Out of scope

- Wiring real auth endpoints (the stub methods stay until the user
  says otherwise).
- Updating `src/api/endpoint.ts` — the file is currently empty and not
  referenced by `SimplifiedRequest`; the chain uses the path string
  passed in `new SimplifiedRequest(request, '/auth/token')`. Leaving
  the file alone.
- Removing the `AuthSpec` / `AuthHandler` exports from anywhere else
  in the repo — only `SimplifiedRequest.ts` and `example-api.ts`
  import them today.

---

## Verification

1. `npx tsc --noEmit` — the type-check should pass cleanly because
   every reference to `AuthHandler` / `AuthSpec` is replaced.
2. Run `npx playwright test tests/api/example/example-api.ts` — the
   three `.fixme` tests will still be skipped (the actual `/login`
   endpoint does not exist), but their TypeScript + chain wiring is
   exercised.
3. Manual check: a smoke test that destructures `{ authClient }` from
   the fixture bag, calls `await authClient.getBearerToken()`, and
   chains `.withAuth('bearer', token)` — verifies the fixture plumbing.
